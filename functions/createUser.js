const ManagementClient = require('auth0').ManagementClient;

module.exports.handler = (event, context, callback) => {
  console.log('createUser');
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);

  const email = requestBody.user.email;
  const name = requestBody.user.name;

  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'create:users',
  });

  const data = {
    connection: 'email',
    email,
    name: name || email,
    email_verified: false,
    verify_email: true
  };
  management.createUser(data, (err) => {
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
        message: 'User created succesfully!',
        data,
      }),
    };
    callback(null, response);
  });
};
