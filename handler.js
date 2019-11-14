'use strict';

const dynamo = require('./dynamo');
const AWS = require('aws-sdk');
const csvJSON = require('csvtojson');
const S3 = new AWS.S3();
const BUCKET_NAME = process.env.DATA_BUCKET;
const faker = require('faker');


const csvToJSON = async s3params => {
  const stream = S3.getObject(s3params).createReadStream();
  const json = await csvJSON().fromStream(stream);
  return json;
};


module.exports.messageInsert = async event => {  
  let records = event.Records
  let dynamoResponses = []
  records.forEach( async function(record) {
    let keyName = record.s3.object.key
    let s3params = {
      Bucket: process.env.DATA_BUCKET,
      Key: keyName
    };
    let jsonRows = await csvToJSON(s3params);

    let item = {}
    jsonRows.forEach(function (jsonRow) {
      ((jsonRow, dynamoResponses) => {
        let keys = Object.keys(jsonRow);
        keys.forEach(function (key) {
          item[key] = { S: jsonRow[key] };
        });
        let dynamoParams = {
          TableName: process.env.MESSAGES_TABLE,
          Item: item
        };
        dynamoResponses.push(dynamoParams);
        dynamo.putItem(dynamoParams, (err, dynamoResponse) => {
          if (err) {
            console.warn(err, err.stack);
          }
          else {
            dynamoResponses.push(dynamoResponse)
            console.log(dynamoResponse);
          }
        });
      })(jsonRow, dynamoResponses);
    })
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'OK'
      }
    )
  };
  
};
