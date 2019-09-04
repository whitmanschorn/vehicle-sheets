const jwt = require('jsonwebtoken');
const ManagementClient = require('auth0').ManagementClient;
const axios = require('axios');

const addMeetingRecord = async ({
      newMeetingId, occurrences, host_id, id, callback,
    }) => {
  console.log('adding meeting record!');
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
  });
  console.log(JSON.stringify(activeMeetings));
  return management.updateAppMetadata({ id }, { activeMeetings }, (err, user) => {
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
      return callback(null, response);
    }

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ activeMeetings }),
    };
    return callback(null, response);
  });
};

module.exports.handler = async (event, context, callback) => {
  console.log('createMeeting');
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);
  const id = requestBody.clientId;
  const zoomUserId = requestBody.zoomUserId; // this will default to AH's account

  // FE should provide params according to the zoom docs
  const meetingParams = requestBody.meetingParams;
  const scheduleFor = meetingParams.scheduleFor || zoomUserId;
  const tokenPayload = {
    iss: process.env.ZOOM_CLIENT_KEY,
    exp: ((new Date()).getTime() + 5000),
  };
  const token = jwt.sign(tokenPayload, process.env.ZOOM_CLIENT_SECRET);
  console.log(meetingParams);

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
      // topic: 'Test Meeting 6',
      // type: 8,
      // duration: 60,
      // start_time: '2019-12-12T14:00:00Z',
      // agenda: 'To test recurring meeting',
      // recurrence: { type: 2, repeat_interval: 1, weekly_days: 5, end_times: 2 },
    },
  };

  const meetingResult = await axios(options);

  console.log(meetingResult.error);
  console.log(meetingResult.data);
  const { id: newMeetingId, occurrences, host_id } = meetingResult.data;
  console.log('now I can call a meeting!');
  return addMeetingRecord({
    newMeetingId, occurrences, host_id, id, callback,
  });
};
