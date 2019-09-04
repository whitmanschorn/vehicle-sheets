const jwt = require('jsonwebtoken');
const ManagementClient = require('auth0').ManagementClient;
const axios = require('axios');

const addMeetingRecord = async ({
      newMeetingId, occurrences, host_id, id, callback,
    }) => {
  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    scope: 'create:users read:users update:users',
  });

  const userResp = await management.getUser({ id });
  const activeMeetings = userResp.app_metadata.activeMeetings || [];
  activeMeetings.push({
    meetingId: newMeetingId,
    occurrences,
    hostId: host_id,
    userId: id,
    files: [],
  });
  const updatedUser = await management.updateAppMetadata({ id }, { activeMeetings });
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ updatedUser }),
  };
  return callback(null, response);
  // TODO error handling
};

module.exports.handler = async (event, context, callback) => {
  console.log('createMeeting');
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);
  const { id } = requestBody;
  const zoomUserId = requestBody.zoomUserId; // this will default to AH's account

  // FE should provide params according to the zoom docs
  const meetingParams = requestBody.meetingParams;
  const scheduleFor = meetingParams.scheduleFor || zoomUserId;
  const tokenPayload = {
    iss: process.env.ZOOM_CLIENT_KEY,
    exp: ((new Date()).getTime() + 5000),
  };
  const token = jwt.sign(tokenPayload, process.env.ZOOM_CLIENT_SECRET);

  const options = {
    method: 'POST',
    url: `https://api.zoom.us/v2/users/${zoomUserId}/meetings`,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    data: {
      ...meetingParams,
      schedule_for: scheduleFor,
    },
  };

  const meetingResult = await axios(options);
  const { id: newMeetingId, occurrences, host_id } = meetingResult.data;
  return addMeetingRecord({
    newMeetingId, occurrences, host_id, id, callback,
  });
};
