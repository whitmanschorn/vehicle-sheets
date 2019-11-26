const GoogleSpreadsheet = require("google-spreadsheet");
const async = require("async");
const uuid = require("uuid/v4");

module.exports.handler = (event, context, callback) => {
  const doc = new GoogleSpreadsheet(process.env.SHEETS_SECRET_KEY);
  let meetingSheet;
  let vehicleKey;
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
      function addNewVehicle(step) {
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
          const vehicleKey = requestBody.vehicle.key || uuid();
          const newRow = { ...vehicle, key: vehicleKey };
          console.log("NEW ROW BEING ADDED: ", newRow);
          meetingSheet.addRow(newRow, () => {
            console.log("row was added", vehicleKey);
            const response = {
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Origin": "*"
              }
            };
            callback(null, response);
            step();
          });
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
