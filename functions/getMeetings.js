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

      const { activeMeetings = [] } = data.app_metadata;
      const tokenPayload = {
        iss: process.env.ZOOM_CLIENT_KEY,
        exp: ((new Date()).getTime() + 5000),
      };
      const token = jwt.sign(tokenPayload, process.env.ZOOM_CLIENT_SECRET);

      // here we will fetch data from zoom
      const activeRequests = activeMeetings.map((meeting) => {
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
      // const pastRequests = activeMeetings.map((meeting) => {
      //   const options = {
      //     method: 'get',
      //     url: `https://api.zoom.us/v2/past_meetings/${meeting.meetingId}`,
      //     headers: {
      //       'User-Agent': 'Zoom-api-Jwt-Request',
      //       'content-type': 'application/json',
      //       Authorization: `Bearer ${token}`,
      //     },
      //   };
      //   return axios(options);
      // });

      // const meetingRequests = [...activeRequests, ...pastRequests];
      const meetingRequests = activeRequests;

      const meetingResponses = await Promise.all(meetingRequests).catch(zoomErr => console.err(zoomErr));
      const meetingData = meetingResponses.map((item) => {
        const currentMeetingRecord = activeMeetings.find(m => parseInt(m.meetingId, 10) === parseInt(item.data.id, 10));
        console.log('!!!', { item: item.data.id, activeMeetings, currentMeetingRecord });
        // const files = currentMeetingRecord.files.filter(file => parseInt(file.occurrence, 10) === parseInt(occurrence.occurrence_id, 10));
        const itemOcc = item.data.occurrences || [];
        const occurrences = itemOcc.map((occurrence) => {
          // const cmRecord = meetingRecords.find(m => parseInt(m.meetingId, 10) === parseInt(meeting.id, 10));
          const recordFiles = currentMeetingRecord.files.filter(file => parseInt(file.occurrence, 10) === parseInt(occurrence.occurrence_id, 10));
          return { ...occurrence, files: recordFiles, service: currentMeetingRecord.service };
        });

        return { ...item.data, occurrences, service: currentMeetingRecord.service };
      });

//       activeMeetings.forEach((request, index) => {
//         const activeResults = meetingResponses[index];
//         const pastResults = meetingResponses[index + activeMeetings.length - 1];
//         if (!(pastResults && pastResults.data)) return activeResults;
//         if (!(activeResults && activeResults.data)) return pastResults;
//
//         const meeting = { ...pastResults.data, ...activeResults.data };
//
//         // combine past and current results leads to doubled occurrences
//         // TODO dedupe instead of preferring future
//         const occurrences = activeResults.data.occurrences || pastResults.data.occurrences;
//         meeting.occurrences = occurrences.map((occurrence) => {
//           const currentMeetingRecord = meetingRecords.find(m => parseInt(m.meetingId, 10) === parseInt(meeting.id, 10));
//           const files = currentMeetingRecord.files.filter(file => parseInt(file.occurrence, 10) === parseInt(occurrence.occurrence_id, 10));
//           return { ...occurrence, files, service: currentMeetingRecord.service };
//         });
//         meetingData.push(meeting);
//         return meeting;
//       });

      newPayload.meetingData = meetingData;

      next(null, { meetingData });
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
              message: 'Meetings fetched succesfully!',
              result,
            }),
          };

          callback(null, response);
        }
      },
    );
};
