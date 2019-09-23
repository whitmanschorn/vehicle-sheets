const ManagementClient = require('auth0').ManagementClient;

const getLabelFromKey = key => key.split('-')[key.split('-').length - 1];

const addFileRecord = async ({
      meeting,
      author,
      id,
      authorId,
      fileKey,
      occurrence,
      callback,
      label,
      fileSize,
    }) => {
  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'create:users read:users update:users',
  });

  const timeStamp = new Date().valueOf();

  const userResp = await management.getUser({ id });
  const fileRecord = {
    author, timeStamp, label: label || getLabelFromKey(fileKey), fileKey, authorId, fileSize,
  };
  if (occurrence) {
    fileRecord.occurrence = occurrence;
  }

  const activeMeetings = userResp.app_metadata.activeMeetings || [];
  // note: zoom IDs are always numbers. If that changes this will break :<
  let index = activeMeetings.findIndex(item => parseInt(item.meetingId, 10) === parseInt(meeting, 10));
  if (meeting === 'binder' && index === -1) {
    // create the client file binder if it is missing
    index = 0;
    activeMeetings.unshift({
      meetingId: 'binder',
      files: [],
    });
  }


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
  console.log('creating file...');
  console.log('creating file...2', event.body);
  // const requestBody = event.body;
  const requestBody = JSON.parse(event.body);
  console.log('creating file...2');
  const author = requestBody.author;
  const authorId = requestBody.authorId || requestBody.id;
  const { id, meeting, occurrence, key, label, fileSize } = requestBody;
  console.log({ id, meeting, occurrence, key, label, fileSize });
  addFileRecord({
    meeting,
    label,
    author,
    id,
    authorId,
    fileKey: key,
    occurrence,
    callback,
    fileSize,
  });
};
