const ManagementClient = require('auth0').ManagementClient;
const moment = require('moment-timezone');

module.exports.handler = (event, context, callback) => {
  console.log('getUser');
  const params = event.queryStringParameters;
  console.log({ params });
  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'read:users',
  });
  // const partnerId = 'testPartner1';
  const { partnerId, name } = params;
  const luceneQuery = [];
  if (partnerId) {
    luceneQuery.unshift(`app_metadata.serviceProviders:("${partnerId}")`);
  }
  if (name) {
    luceneQuery.unshift(`name:*${name}*`);
  }
  const qString = luceneQuery.join(' AND ');
  console.log({ qString });
  const queryTerm = { search_engine: 'v3', q: qString, fields: 'app_metadata name email user_metadata picture' };

  management.getUsers(queryTerm, (err, list) => {
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
        message: 'User list fetched succesfully!',
        list,
      }),
    };
    callback(null, response);
  });
};
