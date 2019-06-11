const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports.handler = (event, context, callback) => {
  console.log('createSource');
  console.log(event);
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);

  // const token = requestBody.token.id;
  const amount = requestBody.source.amount;
  const currency = requestBody.source.currency;
  const description = requestBody.source.description;
  // const email = requestBody.charge.email;

  const requestData = { // Create Stripe source with token
    type: 'wechat',
    statement_descriptor: `Serverless Stripe Test source ${description}`, // Finalize message copy
    amount,
    currency,
  };

  return stripe.sources.create(requestData)
    .then((source) => { // Success response
      console.log(source);
      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Source created succesfully!',
          source,
        }),
      };
      callback(null, response);
    })
    .catch((err) => { // Error response
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
    });
};
