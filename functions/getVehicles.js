const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
// const jwt = require('jsonwebtoken');

const transformMeeting = (item) => {
  const cleaned = {};
  const EXCLUDE = ['_xml', '_links', 'id'];

  Object.keys(item).map((key) => {
    if (EXCLUDE.indexOf(key) === -1) {
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
          body: JSON.stringify(meetingRows),
        };
        callback(null, response);
        step();
      });
    },
  ], (err) => {
    if (err) {
      console.log(`Error: ${err}`);
    }
  });
};
