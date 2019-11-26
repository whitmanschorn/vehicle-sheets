const GoogleSpreadsheet = require("google-spreadsheet");
const async = require("async");
const uuid = require("uuid/v4");

module.exports.handler = (event, context, callback) => {
  const doc = new GoogleSpreadsheet(process.env.SHEETS_SECRET_KEY);
  let meetingSheet;
  let vehicleKey;
  let entry;
  let response;
  const requestBody = JSON.parse(event.body);

  async.series(
    [
      function setAuth(step) {
        const creds = {
          client_email: process.env.GDC_EMAIL,
          private_key: process.env.GDC_SECRET_KEY
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
      function updateVehicle(step) {
        const { vehicle } = requestBody;
        const requiredKeys = [
          "text",
          "key",
          "value",
          "attributesweight",
          "attributesspeed",
          "attributesfootprint",
          "attributesemissions",
          "attributeshealth"
        ];

        let hasAllKeys = true;
        requiredKeys.forEach(key => {
          if(typeof vehicle[key] === 'undefined') hasAllKeys = false;
        })

        if (hasAllKeys) {
          meetingSheet.getRows(
            {
              offset: 0,
              limit: 2,
              query: `key=${vehicle.key}`
            },
            (err, rows) => {
              if (err) {
                console.log(`Error: ${err}`);
              }
              if (rows) {
                console.log(`Read ${rows.length} rows for ${vehicle.key}`);
                requiredKeys.forEach(key => {
                  rows[0][key] = vehicle[key];
                });
                entry = rows[0];
                console.log("saving", { entry: rows[0] });
                rows[0].save(() => {
                  console.log("sending 200 reponse");
                  response = {
                    statusCode: 200,
                    headers: {
                      "Access-Control-Allow-Origin": "*"
                    }
                  };
                  callback(null, response);
                  step();
                });
              } else {
                console.log("no rows found to update");
                step();
              }
            }
          );
        } else {
          console.log("ERROR, VEHICLE MISSING KEYS");
          console.log(
            Object.keys(vehicle)
              .sort()
              .join(",")
          );
          console.log(requiredKeys.sort().join(","));
        }
      }
    ],
    err => {
      if (err) {
        console.log(`Error: ${err}`);
      }
    }
  );
};
