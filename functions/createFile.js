const S3 = require('aws-sdk/clients/s3');

const s3 = new S3();

module.exports.handler = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const role = requestBody.role || 'teacher';
  const id = requestBody.id;
  const file = requestBody.file;
  const filename = requestBody.filename;
  const label = requestBody.label;
  const author = requestBody.author;

  console.log({
    role,
    id,
    filename,
    label,
    author,   
  });

  const ts = new Date().valueOf();
  const params = {
    ACL: 'public-read',
    Bucket: 'ruhe-files',
    Key: `${id}/${role}-${ts}-${filename}`,
    Body: new Buffer(file),
    Metadata: {
      label,
      author,
      authorId: id,
    },
  };
  s3.putObject(params, (err, data) => {
    if (err) {
      console.log(err, err.stack); // an error occurred
      const response = {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          err,
        }),
      };
      return callback(null, response);
    }

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
    callback(null, response);
  });
};
