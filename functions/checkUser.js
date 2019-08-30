const ManagementClient = require('auth0').ManagementClient;
const async = require('async');
const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml
const AUTH_SIGNING_SECRET = process.env.AUTH_SIGNING_SECRET;

const management = new ManagementClient({
  domain: 'dev-wschorn.auth0.com',
  clientId: process.env.AUTH_CLIENT_ID,
  clientSecret: process.env.AUTH_CLIENT_SECRET,
  scope: "read:users"
  // token: process.env.AUTH_MANAGEMENT_SECRET,
});

module.exports.handler = (event, context, callback) => {
  let jwtData;

  async.series([
    function preAuth(step) {
      const authToken = event.headers.Authorization;
      if (!authToken) {
        return callback('Unauthorized');
      }

      const tokenParts = authToken.split(' ');
      const tokenValue = tokenParts[1];

      if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
        // no auth token!
        return callback('Unauthorized');
      }

      jwtData = jwt.verify(tokenValue, AUTH_SIGNING_SECRET);
      step();
    },
    function postAuth(step) {
      const data = { id: jwtData.sub };
      console.log('Post Auth', JSON.stringify(data));
      management.getUser(data, (err) => {
        if (err) {
          // Handle error.
          console.log(err);
          const response = {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: err.message,
            }),
          };
          callback(null, response);
        }
        // User created.
        console.log({ data });
        data.password = null;
        const response = {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            message: 'User verified succesfully!',
            data,
          }),
        };
        callback(null, response);
      });

      // const response = {
      //   statusCode: 200,
      //   headers: {
      //     'Access-Control-Allow-Origin': '*',
      //   },
      //   body: JSON.stringify({
      //     result: jwtData,
      //   }),
      // };
      // callback(null, response);
    },
  ], (err) => {
    if (err) {
      console.log(`Error: ${err}`);
    }
  });
};
