// const GoogleSpreadsheet = require('google-spreadsheet');
const S3 = require('aws-sdk/clients/s3');
const s3 = new S3();
// const async = require('async');

// const MOCK_DATA = [
//   {
//     name: 'Test File A',
//     createdByStudent: false,
//     createdByName: 'Test Instructor Name',
//     createdAt: '2019-08-26T14:45:47-04:00',
//     url: 'https://ruhe-assets.s3.amazonaws.com/duke.mp3',
//   },
//   {
//     name: 'Test File B',
//     createdByStudent: false,
//     createdByName: 'Test Instructor Name',
//     createdAt: '2019-08-25T14:45:47-04:00',
//     url: 'https://ruhe-assets.s3.amazonaws.com/RUHE%20Group%2C%20LLC%20Terms%20%26%20Conditions%20and%20Privacy%20Policy.pdf?response-content-disposition=inline&X-Amz-Security-Token=AgoJb3JpZ2luX2VjEJz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMiJHMEUCIC%2BRhOSQr86SdjqBEzN0Oy2UCWlp71cFzcK6hNzKLvNWAiEA2idzimSKjbAUOMTq5cPvgBCLz3DPsGTC6%2BjpZ6Ipywcq2wMIRRAAGgw3MjMwNDA2MTc3NTUiDOdnSPoKQtgu4ZOmaiq4AxUh3NGnHB2u9UjUgGAVzOy0pVbKLA2b73vHYc3qYcgz4kq6qnsgeH%2F0Bs4qs9GeSmVqQh3A1Ezl%2F8pWDdyLeJQ5N6dzYB8sA5daEvu8jKWV7TUTcu4Xip3LlkuideqjXgkHd1KEGLvqrfQowV3cuLkQ8HkFWfbL0NRK6bzVja43rpto0xBjXezHRWI2LLGYDy4faJU%2BPsHHLycHoXvtwCZcsZWDsHaseaxLjKyWEqnegkxukHR2j9nXOSE%2BUc4pOqomO9YBZIqMlQ%2BSGqbDf2RdxScUVmod4jLd78IHbvOpqMGAJkeKZPLVw1GT2vumUh7wNdPFlTirTh5BSyK6HrWihe6apDXForlevpFobWFDVIdGwonaxgnPsUop570j%2B99LcZj6O5vW7pTOMYbEx77BDP9%2FKBCaNX9a95N9c9%2BLR8laE%2BePcUeZuQO1dCzqss4Sglu6HhCS%2Bv3LDq6jZFHXprED%2FCA0pdBEs%2BOV30mBwMjRgKlHyFOV6y0Ie1A054eC8JheGbspa%2BVM7hSOaSQiwNXtCE1em8xbUOqvLetzODjZfGUGns091iIzS4oz9Z8wyN8kIgiyMKuSj%2BsFOrQBSGJNq87%2BoXo%2Ff0AzOJinANIZbFqpVs46VPkPOMQLWGRun8XCtolXBov2nxuVaWiGHnlEBospoEazKxNr1mHFAwiI44mXsBJ%2FoO%2FiFMasBN83QMK5yHeIrfrbv0q73qlMwUQsUdSG8NTM6OedHOUToyloKa6jzJPo%2FJnsa3WdBC1y%2BRU7GGOWFvgRSDml%2BRX5Hm%2BFGrQqcp0YYzAJdgNvvSFCuxRbYSlsffzdNTzzm4f0Sz2V&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20190826T184427Z&X-Amz-SignedHeaders=host&X-Amz-Expires=299&X-Amz-Credential=ASIA2QWEUIUNZNUZKZXM%2F20190826%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=f00c6e1debcc904122648da0e8193eaaabc495c2eb0b888fa3a6c6a84eda5c42',
//   },
//   {
//     name: 'Test File C',
//     createdByStudent: false,
//     createdByName: 'Test Instructor Name',
//     createdAt: '2019-08-24T14:45:47-04:00',
//     url: 'https://ruhe-assets.s3.amazonaws.com/RUHE%20Group%2C%20LLC%20Terms%20%26%20Conditions%20and%20Privacy%20Policy.pdf?response-content-disposition=inline&X-Amz-Security-Token=AgoJb3JpZ2luX2VjEJz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMiJHMEUCIC%2BRhOSQr86SdjqBEzN0Oy2UCWlp71cFzcK6hNzKLvNWAiEA2idzimSKjbAUOMTq5cPvgBCLz3DPsGTC6%2BjpZ6Ipywcq2wMIRRAAGgw3MjMwNDA2MTc3NTUiDOdnSPoKQtgu4ZOmaiq4AxUh3NGnHB2u9UjUgGAVzOy0pVbKLA2b73vHYc3qYcgz4kq6qnsgeH%2F0Bs4qs9GeSmVqQh3A1Ezl%2F8pWDdyLeJQ5N6dzYB8sA5daEvu8jKWV7TUTcu4Xip3LlkuideqjXgkHd1KEGLvqrfQowV3cuLkQ8HkFWfbL0NRK6bzVja43rpto0xBjXezHRWI2LLGYDy4faJU%2BPsHHLycHoXvtwCZcsZWDsHaseaxLjKyWEqnegkxukHR2j9nXOSE%2BUc4pOqomO9YBZIqMlQ%2BSGqbDf2RdxScUVmod4jLd78IHbvOpqMGAJkeKZPLVw1GT2vumUh7wNdPFlTirTh5BSyK6HrWihe6apDXForlevpFobWFDVIdGwonaxgnPsUop570j%2B99LcZj6O5vW7pTOMYbEx77BDP9%2FKBCaNX9a95N9c9%2BLR8laE%2BePcUeZuQO1dCzqss4Sglu6HhCS%2Bv3LDq6jZFHXprED%2FCA0pdBEs%2BOV30mBwMjRgKlHyFOV6y0Ie1A054eC8JheGbspa%2BVM7hSOaSQiwNXtCE1em8xbUOqvLetzODjZfGUGns091iIzS4oz9Z8wyN8kIgiyMKuSj%2BsFOrQBSGJNq87%2BoXo%2Ff0AzOJinANIZbFqpVs46VPkPOMQLWGRun8XCtolXBov2nxuVaWiGHnlEBospoEazKxNr1mHFAwiI44mXsBJ%2FoO%2FiFMasBN83QMK5yHeIrfrbv0q73qlMwUQsUdSG8NTM6OedHOUToyloKa6jzJPo%2FJnsa3WdBC1y%2BRU7GGOWFvgRSDml%2BRX5Hm%2BFGrQqcp0YYzAJdgNvvSFCuxRbYSlsffzdNTzzm4f0Sz2V&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20190826T184427Z&X-Amz-SignedHeaders=host&X-Amz-Expires=299&X-Amz-Credential=ASIA2QWEUIUNZNUZKZXM%2F20190826%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=f00c6e1debcc904122648da0e8193eaaabc495c2eb0b888fa3a6c6a84eda5c42',
//   },
// ];


module.exports.handler = (event, context, callback) => {
  const { id } = event.queryStringParameters;

  const params = {
    Bucket: 'ruhe-files',
    Prefix: `${id}/`,
  };
  console.log({ params });
  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.log(err, err.stack); // an error occurred
      return callback(400, err.msg);
    }

    console.log(data);           // successful response

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
    callback(null, response);
  });
};
