const soap = require('soap');
const async = require('async');
const ManagementClient = require('auth0').ManagementClient;
const jwt = require('jsonwebtoken');
const AUTH_SIGNING_SECRET = process.env.AUTH_SIGNING_SECRET;

const url = 'http://login.ruhegroup.com/api/2/track.asmx?WSDL';

let soapClient;

const preAuth = (event, data, next) => {
  const authToken = event.headers.Authorization;
  if (!authToken) {
    return next('Unauthorized');
  }

  const tokenParts = authToken.split(' ');
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
    // no auth token!
    return next('Unauthorized');
  }

  const jwtData = jwt.verify(tokenValue, AUTH_SIGNING_SECRET);
  const { sub } = jwtData;
  if (!sub) {
    return next('Auth missing sub');
  }

  return next(null, { ...data, id: sub });
};

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
      const affiliateId = data.user_metadata.affiliate;
      const newPayload = { ...payload, user: data, affiliateId };
      console.log({ newPayload });
      next(null, newPayload);
    } else {
      console.log('NO USER DATA FOUND!', err);
      next(500);
    }
  });
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
  const {
   affiliateId,
   campaignId,
   creativeId,
   subAffiliateId,
   amount,
   note,
  } = payload;

  // put this 24h in the past so timezones don't screw us up
  const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

  const requestArgs = {
    api_key: process.env.CAKE_API_KEY,
    conversion_date: yesterday.toISOString().split('T')[0],
    total_to_insert: 1,
    payout: 0,
    received: amount ? parseInt(amount, 10) : 0,
    note,
    affiliate_id: affiliateId,
    sub_affiliate: subAffiliateId,
    campaign_id: campaignId,
    creative_id: creativeId,
  };

  console.log({ requestArgs });

  client.MassConversionInsert(requestArgs, next);
};

exports.handler = (data, event, context, callback) =>
  // context.callbackWaitsForEmptyEventLoop = true;
   async.waterfall([
     (next) => {
       next(null, event, data);
     },
     preAuth,
     getUserMetadata,
     getClient,
     logConversion,
   ],
      (err, result) => {
        if (err) {
          console.log('ERROR:', err);
          callback(err);
        } else {
          console.log('Conversion logged', result);
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
