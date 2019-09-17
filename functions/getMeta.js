// const jwt = require('jsonwebtoken');
const async = require('async');
// const axios = require('axios');
const ManagementClient = require('auth0').ManagementClient;

const getUserMetadata = (id, payload, next) => {
  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    audience: 'https://dev-wschorn.auth0.com/api/v2/',
    scope: 'read:users',
  });

  console.log({ id });
  if (!id) {
    throw new Error('user needs auth0 ID to get metadata!');
  } // TODO throw error instead of defaulting
  management.getUser({ id }, async (err, data) => {
    if (data) {
      const newPayload = { ...payload, user: data, meta: data.app_metadata };
      next(null, newPayload);
    } else {
      console.log('NO USER DATA FOUND!', err);
      next(500);
    }
  });
};

exports.handler = (event, context, callback) => {
  const { id } = event.queryStringParameters;

  async.waterfall([
    (next) => {
      next(null, id, {});
    },
    getUserMetadata,
  ],
      (err, result) => {
        if (err) {
          console.log('ERROR:', err);
          callback(err);
        } else {
          // console.log('Conversion logged', result);
          const response = {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Meta fetched succesfully!',
              result,
            }),
          };

          callback(null, response);
        }
      },
    );
};
