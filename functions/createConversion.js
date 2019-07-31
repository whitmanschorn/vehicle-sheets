const soap = require('soap');
const async = require('async');

const url = 'http://login.ruhegroup.com/api/2/track.asmx?WSDL';

let soapClient;

const getClient = (payload, next) => {
  console.log('getClient', JSON.stringify({ payload }));
  if (soapClient) { next(null, soapClient, payload); } else {
    soap.createClient(url, (client, result) => next(client, result));
  }
};

const logConversion = (client, payload, next) => {
  console.log('logConversion initiated, proceeding...');
  soapClient = client;
  console.log(JSON.stringify({ c: Object.keys(client), p: Object.keys(payload) }));
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

exports.handler = async (data, context, callback) => {
  // context.callbackWaitsForEmptyEventLoop = true;
  console.log('about to waterfall', JSON.stringify({ data }));
  async.waterfall([
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
          callback(null, result);
        }
      },
    );
};


// module.exports.handler = (event, context, callback) => {
//   console.log('Create Conversion i');
//   context.callbackWaitsForEmptyEventLoop = false;
//   const url = 'http://login.ruhegroup.com/api/2/track.asmx?WSDL';
//   const requestBody = JSON.parse(event.body);
//   console.log(requestBody);
//   const { affiliateId,
//    campaignId,
//    creativeId,
//    subAffiliateId,
//    amount,
//    note,
//    transactionIds,
//   } = requestBody;

//   if (!affiliateId) {
//     const response = {
//       statusCode: 400,
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//       },
//       body: JSON.stringify({
//         error: 'missing affiliate ID',
//       }),
//     };
//     return callback(null, response);
//     // return;
//   }

//   const today = new Date();
//   const requestArgs = {
//     api_key: process.env.CAKE_API_KEY,
//     conversion_date: today.toISOString().split('T')[0],
//     total_to_insert: 1,
//     payout: 0,
//     received: amount ? parseInt(amount, 10) : 0,
//     note,
//     affiliate_id: affiliateId,
//     sub_affiliate: subAffiliateId,
//     campaign_id: campaignId,
//     creative_id: creativeId,
//     transaction_ids: transactionIds,
//   };
//   console.log('Create Conversion ii');

//   soap.createClient(url, (error, client) => {
//     console.log('Create Conversion iii');

//     client.MassConversionInsert(requestArgs, (conversionError, result) => {
//       if (conversionError) {
//         const response = {
//           statusCode: 400,
//           headers: {
//             'Access-Control-Allow-Origin': '*',
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             conversionError,
//           }),
//         };
//         callback(null, response);
//         return response;
//       }

//       const response = {
//         statusCode: 200,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           message: 'Conversion created succesfully!',
//           charged: true,
//           succeeded: true,
//           result: result.MassConversionInsertResult,
//           charge: event.charge,
//         }),
//       };
//       // console.log('got here v', JSON.stringify({ response }));

//       callback(null, response);
//       return response;
//     });
//   });
// };
