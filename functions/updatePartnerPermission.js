const ManagementClient = require('auth0').ManagementClient;

module.exports.handler = (event, context, callback) => {
  console.log('update user services');
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);
  const { id, partnerId, permissions } = requestBody;

  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'create:users read:users update:users',
  });

  // "providerPermissions": {
  //   "testPartner1": {
      // "isApproved": true,
      // "refEnabled": true,
      // "refMeta": {},
      // "isArchived": false
  //   }
  // }
  management.getUser({ id }, (err, data) => {
    if (data) {
      const { providerPermissions = {} } = data.app_metadata;
      providerPermissions[partnerId] = permissions;
      management.updateAppMetadata({ id }, { providerPermissions }, (updateErr, user) => {
        if (updateErr) {
          // Handle updateError.
          console.log(updateErr);
          const response = {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: updateErr.message,
            }),
          };
          callback(null, response);
        }
        // User updated.
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
    } else {
      console.log('NO USER DATA FOUND!', err);
      callback(500);
    }
  });
};
