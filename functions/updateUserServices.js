const ManagementClient = require('auth0').ManagementClient;

module.exports.handler = (event, context, callback) => {
  console.log('update user services');
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);
  const { id, services, referralCredit = '0', approved = true } = requestBody;

  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'create:users read:users update:users',
  });

  management.updateAppMetadata({ id }, { services, referralCredit, approved }, (err, user) => {
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
        message: 'User services updated succesfully!',
        user,
      }),
    };
    callback(null, response);
  });
};
