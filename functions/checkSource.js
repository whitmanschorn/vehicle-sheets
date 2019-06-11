const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports.handler = (event, context, callback) => {
  console.log(event);
  console.log(event);
  const { id } = event.queryStringParameters;
  console.log(event.queryStringParameters);
  console.log('checkSource', id);

  return stripe.sources.retrieve(id)
    .then((source) => { // Success response
      console.log(source);

      if (source.status === 'chargeable') {
        const { amount, currency } = source;
        console.log('charging based on checkSource', id);

        return stripe.charges.create({
          amount,
          currency,
          source: id,
        })
          .then((charge) => {
            console.log('charging success!', id);
            // should check if charge succeeded
            const { succeeded } = charge;

            const response = {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                message: 'charge created succesfully!',
                charged: true,
                succeeded,
                charge,
              }),
            };
            callback(null, response);
          })
          .catch((err) => { // Error response
            console.log('unable to create charge!');
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
      } else {
        const response = {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            message: 'Source updated succesfully!',
            charged: false,
            source,
          }),
        };
        callback(null, response);
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
};
