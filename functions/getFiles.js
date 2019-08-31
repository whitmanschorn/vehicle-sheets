const S3 = require('aws-sdk/clients/s3');
const s3 = new S3();

function getS3ObjectHead(filename) {
  const params = {
    Bucket: 'ruhe-files',
    Key: filename,
  };

  return s3.headObject(params).promise();
}

module.exports.handler = (event, context, callback) => {
  const { id } = event.queryStringParameters;

  const params = {
    Bucket: 'ruhe-files',
    Prefix: `${id}/`,
  };
  console.log({ params });
  s3.listObjectsV2(params, async (err, data) => {
    if (err) {
      console.log(err, err.stack); // an error occurred
      return callback(400, err.msg);
    }

    console.log(data);           // successful response
    const files = data.Contents.filter(item => item.Size > 0);
    const promises = files.map(item => getS3ObjectHead(item.Key));
    const meta = await Promise.all(promises);

    meta.forEach((item) => {
      if (item.Metadata && item.Metadata !== {}) {
        const metaIndex = files.findIndex(file => file.ETag === item.ETag);
        if (metaIndex !== -1) {
          files[metaIndex].Metadata = item.Metadata;
        }
      }
    });

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ files }),
    };
    callback(null, response);
  });
};
