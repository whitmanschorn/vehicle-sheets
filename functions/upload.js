const S3 = require('aws-sdk/clients/s3');

const s3 = new S3({ region: 'ap-east-1' });

module.exports.handler = (event, context, callback) => {
  const { id, key, contentType } = event.queryStringParameters;
  console.log('upload request initiated', { id, key });
  // const timestamp = new Date().valueOf();
  // const idParts = id.split('|');
  console.log({ id, key, contentType });
  const signedUrlExpireSeconds = 7 * 24 * 60 * 60;

  s3.getSignedUrl('putObject', {
    Bucket: 'ruhe-files',
    Key: key,
    Expires: signedUrlExpireSeconds,
    ACL: 'public-read',
    ContentType: contentType,
  }, (err, data) => {
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
    console.log(data);
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: data,
    };
    console.log('about to respond ok');
    callback(null, response);
  });
};
