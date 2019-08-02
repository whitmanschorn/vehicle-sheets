const soap = require('soap');
const async = require('async');
const ManagementClient = require('auth0').ManagementClient;

const url = 'http://login.ruhegroup.com/api/2/track.asmx?WSDL';

let soapClient;

const getUserMetadata = (payload, next) => {
  // updates payload with 'user'
  // updates payload with 'user'
  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    audience: 'https://dev-wschorn.auth0.com/api/v2/',
    scope: 'read:users',
  });
  const id = payload.id;
  console.log({ id });
  if (!id) {
    throw new Error('user needs auth0 ID to log conversion!');
  } // TODO throw error instead of defaulting
  management.getUser({ id }, (err, data) => {
    if (data) {
      const affiliateId = data.user.user_metadata.affiliate;
      const newPayload = { user: data.user, affiliateId, ...payload };
      next(null, newPayload);
    } else {
      console.log('NO USER DATA FOUND!', err);
    }
  });

  // next(null, payload);
};
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
   user,
  } = payload;
  const today = new Date();
  console.log('user:', JSON.stringify({ user }));
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
    getUserMetadata,
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
