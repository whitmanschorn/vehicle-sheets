const S3 = require('aws-sdk/clients/s3');

const s3 = new S3();

module.exports.handler = (event, context, callback) => {
  const { id, key } = event.queryStringParameters;
  console.log('upload request initiated', { id, key });
  // const timestamp = new Date().valueOf();
  // const idParts = id.split('|');
  s3.getSignedUrl('putObject', {
    Bucket: 'ruhe-files',
    Expires: 60 * 60,
    ACL: 'public-read',
    Key: key,
  }, (err, url) => {
    if (err) {
    // Handle error.
      console.error(err);
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
    console.log(url);
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: url,
    };
    callback(null, response);
  });
};
