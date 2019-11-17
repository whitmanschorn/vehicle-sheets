const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
// const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml

const transformMeeting = ({ status, startat, endat, members, url, sub, id, _xml, _links, ...others }) => ({
  status,
  sub,
  url,
  members: members.split(','),
  startAt: startat,
  endAt: endat,
  ...others,
});

module.exports.handler = (event, context, callback) => {
  const doc = new GoogleSpreadsheet(process.env.SHEETS_SECRET_KEY);
  let clientSheet;
  let meetingSheet;
  let meetingRows = [];
  // let jwtData;
  const { sub } = event.queryStringParameters;

  // return callback(null, response);
  async.series([
    // function preAuth(step) {
    //   const authToken = event.headers.Authorization;
    //   if (!authToken) {
    //     return callback('Unauthorized');
    //   }

    //   const tokenParts = authToken.split(' ');
    //   const tokenValue = tokenParts[1];

    //   if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
    //     // no auth token!
    //     return callback('Unauthorized');
    //   }

    //   jwtData = jwt.verify(tokenValue, AUTH_SIGNING_SECRET);
    //   step();
    // },
    function setAuth(step) {
      const creds = {
        client_email: process.env.GDC_EMAIL,
        private_key: process.env.GDC_SECRET_KEY,
      };

      doc.useServiceAccountAuth(creds, step);
    },
    function getFileList(step) {
      doc.getInfo((err, info) => {
        console.log(`Loaded doc: ${info.title} by ${info.author.email}`);
        clientSheet = info.worksheets[0];
        meetingSheet = info.worksheets[2];
        console.log(`clientSheet: ${clientSheet.title} ${clientSheet.rowCount}x${clientSheet.colCount}`);
        step();
      });
    },
    function getMeetings(step) {
      const queryParam = 'sub';

      meetingSheet.getRows({
        offset: 0,
        limit: 20,
        orderby: 'col2',
        query: `${queryParam}=${sub}`,
      }, (err, rows) => {
        if (err) {
          console.log(`Error: ${err}`);
        }
        if (rows) {
          console.log(`Read ${rows.length} rows for ${queryParam}: ${sub}`);
          meetingRows = rows.map(transformMeeting);
        }
        step();
      });
    },
    function getClientRow(step) {
      const queryParam = 'sub';

      if (!sub) {
        console.log('No sub ID found to look for in ledger!');
        callback('No sub ID found to look for in ledger!');
        return;
      }

      clientSheet.getRows({
        offset: 0,
        limit: 2,
        orderby: 'col2',
        query: `${queryParam}=${sub}`,
      }, (err, rows) => {
        if (err) {
          console.log(`Error: ${err}`);
        }
        if (rows) {
          console.log(`Read ${rows.length} rows for ${queryParam}: ${sub}`);
          const entry = rows[0] || {};
          console.log(JSON.stringify({ entry }));
          const result = {
            name: entry.name,
            service: entry.service,
            serviceAmount: entry.serviceamount,
            refAmount: entry.refamount,
            refUrl: entry.refurl,
          };
          const response = {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              ledger: result,
              meetings: meetingRows,
            }),
          };
          callback(null, response);
        }
        step();
      });
    },
  ], (err) => {
    if (err) {
      console.log(`Error: ${err}`);
    }
  });
};
