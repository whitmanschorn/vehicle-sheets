const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
// const jwt = require('jsonwebtoken');

const transformMeeting = (item) => {
  const cleaned = {};
  const EXCLUDE = ['_xml', '_links'];

  Object.keys(item).map((key) => {
    if (key.includes('attributes')) {
      const cleanKey = key.replace('attributes', '');
      cleaned[cleanKey] = item[key];
    } else if (EXCLUDE.indexOf(key) !== -1) {
      // cleaned[key] = item[key];
    } else {
      cleaned[key] = item[key];
    }
  });
  return cleaned;
};

module.exports.handler = (event, context, callback) => {
  const doc = new GoogleSpreadsheet(process.env.SHEETS_SECRET_KEY);
  let meetingSheet;
  let meetingRows = [];
  // const { sub } = event.queryStringParameters;

  async.series([
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
        meetingSheet = info.worksheets[0];
        step();
      });
    },
    function getMeetings(step) {
      meetingSheet.getRows({
        offset: 0,
        limit: 200,
        // orderby: 'col2',
      }, (err, rows) => {
        if (err) {
          console.log(`Error: ${err}`);
        }
        if (rows) {
          console.log(`Read ${rows.length} rows`);
          meetingRows = rows.map(transformMeeting);
        }


        if (event.queryStringParameters) {
          const { id, name } = event.queryStringParameters;
          const matchesParams = (item) => {
            if (id) return item.id === id;
            if (name) return item.text && item.text.toLowerCase().includes(name.toLowerCase());
            return true;
          };
          meetingRows = meetingRows.filter(matchesParams);
        }
        const response = {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: meetingRows,
        };
        callback(null, response);
        step();
      });
    },
//     function getClientRow(step) {
//       const response = {
//         statusCode: 200,
//         headers: {
//           'Access-Control-Allow-Origin': '*',
//         },
//         body: JSON.stringify({
//           result,
//           meetings: meetingRows,
//         }),
//       };
//       callback(null, response);
//
//       const queryParam = 'id';
//
//       if (!sub) {
//         console.log('No sub ID found to look for in ledger!');
//         callback('No sub ID found to look for in ledger!');
//         return;
//       }
//
//       clientSheet.getRows({
//         offset: 0,
//         limit: 2,
//         orderby: 'col2',
//         query: `${queryParam}=${sub}`,
//       }, (err, rows) => {
//         if (err) {
//           console.log(`Error: ${err}`);
//         }
//         if (rows) {
//           console.log(`Read ${rows.length} rows for ${queryParam}: ${sub}`);
//           const entry = rows[0] || {};
//           console.log(JSON.stringify({ entry }));
//
//
//           const { key, text, value, weight, speed, footprint, emissions, health } = entry;
//
//           const result = {
//             key, text, value, weight, speed, footprint, emissions, health,
//           };
//           const response = {
//             statusCode: 200,
//             headers: {
//               'Access-Control-Allow-Origin': '*',
//             },
//             body: JSON.stringify({
//               result,
//               meetings: meetingRows,
//             }),
//           };
//           callback(null, response);
//         }
//         step();
//       });
//     },
  ], (err) => {
    if (err) {
      console.log(`Error: ${err}`);
    }
  });
};
