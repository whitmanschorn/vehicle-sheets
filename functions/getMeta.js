const jwt = require('jsonwebtoken');
const async = require('async');
const axios = require('axios');
const ManagementClient = require('auth0').ManagementClient;

const getUserMetadata = (id, payload, next) => {
  const management = new ManagementClient({
    domain: 'dev-wschorn.auth0.com',
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    audience: 'https://dev-wschorn.auth0.com/api/v2/',
    scope: 'read:users',
  });

  console.log({ id });
  if (!id) {
    throw new Error('user needs auth0 ID to get metadata!');
  } // TODO throw error instead of defaulting
  management.getUser({ id }, async (err, data) => {
    if (data) {
      const newPayload = { ...payload, user: data, meta: data.app_metadata };
      // console.log({ newPayload });

      const { activeMeetings = [] } = data.app_metadata;
      const tokenPayload = {
        iss: process.env.ZOOM_CLIENT_KEY,
        exp: ((new Date()).getTime() + 5000),
      };
      const token = jwt.sign(tokenPayload, process.env.ZOOM_CLIENT_SECRET);

      // here we will fetch data from zoom
      const meetingRequests = activeMeetings.map((meeting) => {
        const options = {
          method: 'get',
          url: `https://api.zoom.us/v2/meetings/${meeting.meetingId}`,
          headers: {
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };
        return axios(options);
      });

      const meetingRecords = newPayload.user.app_metadata.activeMeetings;
      const meetingResponses = await Promise.all(meetingRequests);
      const meetingData = meetingResponses.map((item) => {
        const meeting = item.data;
        meeting.occurrences = meeting.occurrences.map((occurrence) => {
          const currentMeetingRecord = meetingRecords.find(m => parseInt(m.meetingId, 10) === parseInt(meeting.id, 10));
          const files = currentMeetingRecord.files.filter((file) => {
            return parseInt(file.occurrence, 10) === parseInt(occurrence.occurrence_id, 10);
          });
          return { ...occurrence, files, service: currentMeetingRecord.service };
        });

        return meeting;
      });
      // console.log(meetingData);

      newPayload.meetingData = meetingData;

      next(null, newPayload);
    } else {
      console.log('NO USER DATA FOUND!', err);
      next(500);
    }
  });
};

exports.handler = (event, context, callback) => {
  const { id } = event.queryStringParameters;

  async.waterfall([
    (next) => {
      next(null, id, {});
    },
    getUserMetadata,
  ],
      (err, result) => {
        if (err) {
          console.log('ERROR:', err);
          callback(err);
        } else {
          // console.log('Conversion logged', result);
          const response = {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Meta fetched succesfully!',
              result,
            }),
          };

          callback(null, response);
        }
      },
    );
};
