const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');

module.exports.handler = (event, context, callback) => {
  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(process.env.SHEETS_SECRET_KEY);
  let sheet;
  const { id } = event.queryStringParameters;
  console.log('checkSource', id);

  async.series([
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
          callback(null, rows);
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
