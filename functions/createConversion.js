const soap = require('soap');
const moment = require('moment-timezone');
const async = require('async');
const ManagementClient = require('auth0').ManagementClient;
const jwt = require('jsonwebtoken');

const AUTH_SIGNING_SECRET = process.env.AUTH_SIGNING_SECRET;

const url = 'http://login.ruhegroup.com/api/2/track.asmx?WSDL';

let soapClient;

const RMB_COEFFICIENT = 1 / 6.94;
const PAYOUT_COEFFICIENT = 0.075;

const preAuth = (data, next) => {
  const { authToken } = data;
  if (!authToken) {
    return next('Unauthorized: No auth token');
  }

  const tokenParts = authToken.split(' ');
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
    // no auth token!
    return next('Unauthorized: No bearer');
  }

  const jwtData = jwt.verify(tokenValue, AUTH_SIGNING_SECRET);
  const { sub } = jwtData;
  if (!sub) {
    return next('Auth missing sub');
  }

  return next(null, { ...data, id: sub });
};

const getUserMetadata = (payload, next) => {
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
      const campaignId = data.user_metadata.campaign;
      const creativeId = data.user_metadata.creative;
      const newPayload = { ...payload, user: data, affiliateId, campaignId, creativeId };
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

const DEFAULT_AFFILIATE = 3;
const DEFAULT_CAMPAIGN = 11;
const DEFAULT_CREATIVE = 6;

const logConversion = (client = {}, payload = {}, next = {}) => {
  soapClient = client;
  const {
   subAffiliateId,
   amount,
   currency,
   note,
  } = payload;

  let {
   affiliateId,
   campaignId,
   creativeId,
 } = payload;

  // Hack because of logic that sets "undefined" strings in auth0 metadata
  const undefStr = 'undefined';
  const defaultOnUndef = (item, defaultValue) => (!affiliateId || affiliateId.includes && affiliateId.includes(undefStr)) ? defaultValue : item;
  console.log({ affiliateId, campaignId, creativeId });
  affiliateId = defaultOnUndef(affiliateId, DEFAULT_AFFILIATE);
  campaignId = defaultOnUndef(campaignId, DEFAULT_CAMPAIGN);
  creativeId = defaultOnUndef(creativeId, DEFAULT_CREATIVE);

  const cDate = moment().tz('America/New_York').format('YYYY-MM-DD');
  const getUsd = (currencyString, amountInt) => {
    if (currencyString === 'USD') return amountInt;
    return amountInt * RMB_COEFFICIENT;
  };
  // currency = 'USD' ?
  const received = amount ? getUsd(currency, parseInt(amount, 10)) : 0;
  const payout = Math.floor(received * PAYOUT_COEFFICIENT);
  const requestArgs = {
    api_key: process.env.CAKE_API_KEY,
    conversion_date: cDate.split(',')[0],
    total_to_insert: 1,
    payout,
    received,
    note,
    affiliate_id: affiliateId,
    sub_affiliate: subAffiliateId,
    campaign_id: campaignId,
    creative_id: creativeId,
  };

  console.log({ requestArgs });

  client.MassConversionInsert(requestArgs, next);
};

exports.handler = (data, context, callback) =>
  // context.callbackWaitsForEmptyEventLoop = true;
  async.waterfall([
    (next) => {
      console.log('creating conversion', JSON.stringify({ data }));
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
