const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const createConversion = require('./createConversion').handler;

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
  const description = requestBody.charge.description;
  const metadata = requestBody.charge.metadata;

  return stripe.charges.create({ // Create Stripe charge with token
    amount,
    currency,
    description,
    source: token,
    metadata: { email, name, description, ...metadata },
  })
    .then((charge) => { // Success response
      console.log(charge);
      const DEFAULT_AFFILIATE = 2;
      const DEFAULT_CREATIVE = 6;
      const DEFAULT_CAMPAIGN = 10;
      const conversionParams = {
        amount,
        charge,
        creativeId: metadata.creativeId || DEFAULT_CREATIVE,
        campaignId: metadata.campaignId || DEFAULT_CAMPAIGN,
        affiliateId: metadata.affiliateId || DEFAULT_AFFILIATE,
        note: `${description} ${JSON.stringify({ metadata })}`,
      };
      return createConversion(conversionParams, context, callback);
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
