const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH_CLIENT_ID;
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH_CLIENT_SECRET;

module.exports.handler = (event, context, callback) => {
  // spreadsheet key is the long id in the sheets URL
  console.log('checkSource begin!');
  const doc = new GoogleSpreadsheet(process.env.SHEETS_SECRET_KEY);
  let sheet;
  let jwtData;
  let id;
  if (event.queryStringParameters) {
    id = event.queryStringParameters.id;
  } else {
    id = 'foo';
  }
  console.log('checkSource', id);

  async.series([
    function preAuth(step) {
      if (!event.authorizationToken) {
        return callback('Unauthorized');
      }

      const tokenParts = event.authorizationToken.split(' ');
      const tokenValue = tokenParts[1];

      if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
        // no auth token!
        return callback('Unauthorized');
      }
      const options = {
        audience: AUTH0_CLIENT_ID,
      };

      try {
        jwt.verify(tokenValue, AUTH0_CLIENT_PUBLIC_KEY, options, (verifyError, decoded) => {
          if (verifyError) {
            console.log('verifyError', verifyError);
            // 401 Unauthorized
            console.log(`Token invalid. ${verifyError}`);
            return callback('Unauthorized');
          }
          console.log('valid from customAuthorizer', decoded);
          jwtData = decoded;
          return step();
        });
      } catch (err) {
        console.log('catch error. Invalid token', err);
        return callback('Unauthorized');
      }

      // to appease the linter
      return callback('How did I get here?');
    },
    function setAuth(step) {
      // see notes below for authentication instructions!

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
    // google provides some query options
      sheet.getRows({
        offset: 0,
        limit: 2,
        orderby: 'col2',
        query: `id=${id}`,
      }, (err, rows) => {
        if (err) {
          console.log(`Error: ${err}`);
        }
        if (rows) {
          console.log(`Read ${rows.length} rows`);
          callback(null,
            {
              statusCode: 200,
              headers: {
      /* Required for CORS support to work */
                'Access-Control-Allow-Origin': '*',
      /* Required for cookies, authorization headers with HTTPS */
                'Access-Control-Allow-Credentials': true,
              },
              body: { rows, jwtData } });
        }
        step();
      });
    },
  ], (err) => {
    if (err) {
      console.log(`Error: ${err}`);
    }
  });


  // const { id } = event.queryStringParameters;
  // console.log('checkLedger', id);
  // const secret = process.env.SHEETS_SECRET_KEY;
  // const url = `https://spreadsheets.google.com/feeds/list/${secret}/od6/public/values?alt=json`;

  // request({
  //   json: true,
  //   url,
  // }, (error, response, body) => {
  //   if (error || response.statusCode !== 200) return;

  //   const parsed = body.feed.entry.map((entry) => {
  //     const columns = {
  //       updated: entry.updated.$t,
  //     };

  //     // Dynamically add all relevant columns from the Sheets to the response
  //     Object.keys(entry).forEach((key) => {
  //       if (/gsx\$/.test(key)) {
  //         const newKey = key.replace('gsx$', '');
  //         columns[newKey] = entry[key].$t;
  //       }
  //     });

  //     return columns;
  //   });

    // callback(null, parsed);
  // });
};
