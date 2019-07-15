const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml
const AUTH_SIGNING_SECRET = process.env.AUTH_SIGNING_SECRET;

const errHeaders = body => ({
  statusCode: 401,
  headers: {
      /* Required for CORS support to work */
    'Access-Control-Allow-Origin': '*',
      /* Required for cookies, authorization headers with HTTPS */
    'Access-Control-Allow-Credentials': true,
  },
  body,
}
            );

module.exports.handler = (event, context, callback) => {
  // spreadsheet key is the long id in the sheets URL
  console.log('checkSource begin!');
  const doc = new GoogleSpreadsheet(process.env.SHEETS_SECRET_KEY);
  let sheet;
  let jwtData;

  async.series([
    function preAuth(step) {
      const authToken = event.headers.Authorization;
      if (!authToken) {
        return callback('Unauthorized');
      }

      const tokenParts = authToken.split(' ');
      const tokenValue = tokenParts[1];

      if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
        // no auth token!
        return callback('Unauthorized');
      }

      jwtData = jwt.verify(tokenValue, AUTH_SIGNING_SECRET);
      step();
    },
    function setAuth(step) {
      const creds = {
        client_email: process.env.GDC_EMAIL,
        private_key: process.env.GDC_SECRET_KEY,
      };

      doc.useServiceAccountAuth(creds, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo((err, info) => {
        console.log(`Loaded doc: ${info.title} by ${info.author.email}`);
        sheet = info.worksheets[0];
        console.log(`sheet 1: ${sheet.title} ${sheet.rowCount}x${sheet.colCount}`);
        step();
      });
    },
    function workingWithRows(step) {
      let queryParam = 'sub';
      const { sub } = jwtData;
      let id;
      if (sub && sub.indexOf('|') !== -1) {
        const slicedSub = sub.split('|')[1];
        id = slicedSub;
      }
      console.log(JSON.stringify({ jwtData }));
      if (event.queryStringParameters) {
        id = event.queryStringParameters.id;
        queryParam = 'id';
      }

      if (!id) {
        console.log('No ID found to look for in ledger!');
        callback('No ID found to look for in ledger!');
        return;
      }

      console.log(`about to fetch ${queryParam}: ${encodeURI(id)}`);

      sheet.getRows({
        offset: 0,
        limit: 2,
        orderby: 'col2',
        query: `${queryParam}=${id}`,
      }, (err, rows) => {
        if (err) {
          console.log(`Error: ${err}`);
        }
        if (rows) {
          console.log(`Read ${rows.length} rows for ${queryParam}: ${id}`);
          const entry = rows[0] || {};
          entry._xml = null;
          entry.notes = null;
          const response = {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              result: entry,
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
