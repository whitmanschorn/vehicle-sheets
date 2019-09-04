const S3 = require('aws-sdk/clients/s3');
const ManagementClient = require('auth0').ManagementClient;

const s3 = new S3();


const addFileRecord = async ({
      meeting,
      label,
      author,
      timeStamp,
      id,
      authorId,
      fileKey,
      occurrence,
      callback,
      fileSize,
    }) => {
  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'create:users read:users update:users',
  });

  const userResp = await management.getUser({ id });
  const fileRecord = {
    label, author, timeStamp, fileKey, authorId, fileSize,
  };
  if (occurrence) {
    fileRecord.occurrence = occurrence;
  }

  const activeMeetings = userResp.app_metadata.activeMeetings || [];
  console.log({ activeMeetings, meeting });
  // note: zoom IDs are always numbers. If that changes this will break :<
  const index = activeMeetings.findIndex(item => parseInt(item.meetingId, 10) === parseInt(meeting, 10));

  if (index === -1) {
    console.error('found NO meeting to associate with file');
    const response = {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        err: 'found no meeting to associate with file',
      }),
    };
    return callback(null, response);
  }
  if (!activeMeetings[index].files) {
    activeMeetings[index].files = [];
  }
  activeMeetings[index].files.push(fileRecord);
  console.log(JSON.stringify(activeMeetings));
  management.updateAppMetadata({ id }, { activeMeetings }, (err, user) => {
    if (err) {
    // Handle error.
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

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ user, file: fileRecord }),
    };
    callback(null, response);
  });
};


module.exports.handler = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const role = requestBody.role || 'teacher';
  const id = requestBody.id;
  const meeting = requestBody.meeting;
  const occurrence = requestBody.occurrence || '';
  const file = requestBody.file;
  const filename = requestBody.filename;
  const label = requestBody.label;
  // if we are writing a file for another user, specify our own author ID
  const authorId = requestBody.authorId || requestBody.id;
  const author = requestBody.author;

  const timeStamp = new Date().valueOf();
  const fileKey = `${id.split('|')[1]}/${role}-${timeStamp}-${filename}`;
  const body = Buffer.from(file, 'base64');
  const params = {
    ACL: 'public-read',
    Bucket: 'ruhe-files',
    Key: fileKey,
    Body: body,
    Metadata: {
      label,
      author,
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

    addFileRecord({
      meeting,
      label,
      author,
      timeStamp,
      id,
      authorId,
      fileKey,
      occurrence,
      callback,
      fileSize: body.length,
    });
  });
};
