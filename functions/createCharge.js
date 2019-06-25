const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCharge = (customerId, onComplete, { amount, currency, token, email, name }) => {
  stripe.charges.create({ // Create Stripe charge with token
    amount,
    currency,
    description: 'Serverless Stripe Test charge',
    source: token,
    metadata: { email, name },
  })
    .then((charge) => { // Success response
      console.log(charge);
      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Charge processed succesfully!',
          charge,
        }),
      };
      onComplete(null, response);
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
      onComplete(null, response);
    });
};


module.exports.handler = (event, context, callback) => {
  console.log('createCharge');
  console.log(event);
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);

  const token = requestBody.token.id;
  const amount = requestBody.charge.amount;
  const currency = requestBody.charge.currency;
  const email = requestBody.charge.email;
  const name = requestBody.charge.name;


  // create or find customer

  stripe.customers.list({ limit: 1, email })
    .then((customers) => {
      const cust = customers[0];
      console.log('found customer', cust);
      if (cust && cust.id) {
        return createCharge(cust.id, callback, { amount, currency, token, email, name });
      }
      // no customer found, so we create one
      stripe.customers.create({ email, name })
        .then((newCustomer) => {
          if (newCustomer && newCustomer.id) {
            return createCharge(newCustomer.id, callback, { amount, currency, token, email, name });
          }
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
