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
    function getFileList(step) {
      doc.getInfo((err, info) => {
        console.log(`Loaded doc: ${info.title} by ${info.author.email}`);
        sheet = info.worksheets[0];
        console.log(`sheet 1: ${sheet.title} ${sheet.rowCount}x${sheet.colCount}`);
        step();
      });
    },
  ], (err) => {
    if (err) {
      console.log(`Error: ${err}`);
    }
  });
};
