const soap = require('soap');
const async = require('async');

const url = 'http://login.ruhegroup.com/api/2/track.asmx?WSDL';

let soapClient;

const getClient = (payload, next) => {
  if (soapClient) { next(null, soapClient, payload); } else {
    try {
      soap.createClient(url, (err, client) => {
        next(null, client, payload);
      });
    } catch (err) {
      console.log('client creation error!', err);
    }
  }
};

const logConversion = (client = {}, payload = {}, next = {}) => {
  soapClient = client;
  const { affiliateId,
   campaignId,
   creativeId,
   subAffiliateId,
   amount,
   note,
   transactionIds,
  } = payload;
  const today = new Date();
  const requestArgs = {
    api_key: process.env.CAKE_API_KEY,
    conversion_date: today.toISOString().split('T')[0],
    total_to_insert: 1,
    payout: 0,
    received: amount ? parseInt(amount, 10) : 0,
    note,
    affiliate_id: affiliateId,
    sub_affiliate: subAffiliateId,
    campaign_id: campaignId,
    creative_id: creativeId,
    transaction_ids: transactionIds,
  };

  client.MassConversionInsert(requestArgs, next);
};

exports.handler = (data, context, callback) => {
  // context.callbackWaitsForEmptyEventLoop = true;
  console.log('about to waterfall', JSON.stringify({ data }));
  return async.waterfall([
    (next) => {
      next(null, data);
    },
    getClient,
    logConversion,
  ],
      (err, result) => {
        if (err) {
          console.log('ERROR:', err);
          callback(err);
        } else {
          console.log('GOT TO FINAL CALLBACK YAY');

          const response = {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Conversion created succesfully!',
              charged: true,
              succeeded: true,
              result,
              charge: data.charge,
            }),
          };

          callback(null, response);
        }
      },
    );
};
