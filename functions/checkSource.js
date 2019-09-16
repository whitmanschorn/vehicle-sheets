const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const createConversion = require('./createConversion').handler;

module.exports.handler = (event, context, callback) => {
  const { id, userId } = event.queryStringParameters;
  console.log('checkSource', id);

  stripe.sources.retrieve(id)
    .then((source) => { // Success response
      console.log(source);
      if (source.status === 'chargeable') {
        const { amount, currency, metadata, description } = source;
        console.log('charging based on checkSource', id);
        const { credits } = metadata;
        metadata.userId = userId;
        stripe.charges.create({
          amount,
          currency,
          metadata,
          description,
          source: id,
        })
          .then((charge) => {
            console.log('charging success!', id);
            // should check if charge succeeded
            const succeeded = charge.status === 'succeeded';
            // const { succeeded } = charge;

            if (!succeeded) {
              console.log('charge did not succeed!', JSON.stringify({ charge }));
              const response = {
                statusCode: 500,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                  error: `charge did not succeed! for source ${id}`,
                  charge,
                }),
              };
              return callback(null, response);
            }

            const DEFAULT_AFFILIATE = 2;
            const DEFAULT_CREATIVE = 6;
            const DEFAULT_CAMPAIGN = 10;
            const conversionParams = {
              id: userId,
              amount: parseInt(amount, 10) / 100,
              currency,
              charge,
              credits,
              creativeId: metadata.creativeId || DEFAULT_CREATIVE,
              campaignId: metadata.campaignId || DEFAULT_CAMPAIGN,
              affiliateId: metadata.affiliateId || DEFAULT_AFFILIATE,
              note: `${description} ${JSON.stringify({ metadata })}`,
            };
            return createConversion(conversionParams, context, callback);
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
            return callback(null, response);
          });
      } else if (source.status !== 'chargeable') {
        const response = {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            message: 'Source fetched succesfully, did not charge!',
            source,
          }),
        };
        return callback(null, response);
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
      return callback(null, response);
    });
};
