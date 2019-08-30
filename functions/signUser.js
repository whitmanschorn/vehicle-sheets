const ManagementClient = require('auth0').ManagementClient;
const moment = require('moment-timezone');

module.exports.handler = (event, context, callback) => {
  console.log('createUser');
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);
  const { id } = requestBody;
  const timestamp = moment().tz('America/New_York').format();

  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'create:users read:users update:users',
  });

  management.updateUserMetadata({ id }, { timestamp }, (err, user) => {
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
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'User signed succesfully!',
        user,
      }),
    };
    callback(null, response);
  });
};
