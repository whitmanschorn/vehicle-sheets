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
  const type = requestBody.source.type || 'wechat';
  const email = requestBody.source.email;
  const name = requestBody.source.name;
  const returnUrl = requestBody.source.returnUrl;

  const requestData = { // Create Stripe source with token
    type,
    statement_descriptor: `RUHE Group LLC Charge - ${description}`, // Finalize message copy
    amount,
    currency,
    owner: { email, name },
  };

  if (type === 'alipay') {
    requestData.redirect = { return_url: returnUrl || 'http://localhost:3000/paid' };
  }

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
