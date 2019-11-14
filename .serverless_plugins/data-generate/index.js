'use strict';

const s3 = require('@auth0/s3');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const faker = require('faker');


class ServerlessDataGenerate {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.generate = this.serverless.service.custom.dataGenerate[0];
    this.bucketName = process.env.DATA_BUCKET;
    this.localDir = this.generate.localDir;

    this.commands = {
      csv: {
        usage: 'Generates a CSV of data and uploads it to your s3 bucket',
        lifecycleEvents: ['generate', 'upload'],
        options: {
          rows: {
            usage:
              'Specify the number of rows to create in your csv ' +
              '(e.g. "--rows 3" or "-m 5")',
            required: true,
          },
          file: {
            usage:
              'Specify the filename ' +
              '(e.g. "--file test" or "-f test")',
            required: true,
            shortcut: 'f',
          }
        },
      },
    };

    this.hooks = {
      'before:csv:generate': this.beforeGenerate.bind(this),
      'csv:generate': this.generateCSV.bind(this),
      'before:csv:upload': this.beforeUpload.bind(this), 
      'csv:upload': this.upload.bind(this),
      'after:csv:upload': this.afterUpload.bind(this),
    };
  }

  beforeGenerate() {
    this.serverless.cli.log(`Generating csv ${this.options.file}.csv with ${this.options.rows} rows`);
  }

  async generateCSV() {
    let fileName = [this.options.file, 'csv'].join('.');
    let filePath = ['.', this.localDir, fileName].join('/')
    let dynamicColumn = faker.lorem.word();

    // path: './data/test4.csv',
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
          {id: 'customerId', title: 'customerId'},
          {id: 'agentId', title: 'agentId'},
          {id: 'date', title: 'date'},
          {id: 'message', title: 'message'},
          {id: dynamicColumn, title: dynamicColumn}
      ]
    });

    const records = []
    let rows = this.options.rows;

    for(let i = 0; i < rows; i++) {
      let customerId = Math.floor(Math.random() * 100);
      let agentId = Math.floor(Math.random() * 100);
      let date = faker.date.past();//.toISOString().split('T')[0];
      let message = faker.hacker.phrase();
      let randomColumn = faker.hacker.verb();

      let row = {customerId: customerId, agentId: agentId, date: date, message: message};
      row[dynamicColumn] = randomColumn
      records.push(row);
    }

    csvWriter.writeRecords(records)
    .then(() => {
      this.serverless.cli.log(`${this.options.rows} rows added to ${this.options.file}.csv`);
    });
  }

  beforeUpload() {
    this.serverless.cli.log(`Uploading to s3 bucket ${this.bucketName}`)
  }

  client() {
    const provider = this.serverless.getProvider('aws');
    const awsCredentials = provider.getCredentials();
    const s3Client = new provider.sdk.S3({
      region: awsCredentials.region,
      credentials: awsCredentials.credentials,
    });

    return s3.createClient({ s3Client });
  }

  upload() {
    let fileName = [this.options.file, 'csv'].join('.');
    let filePath = ['.', this.localDir, fileName].join('/');
    
    let params = {
      localFile: filePath,
      s3Params: {
        Bucket: this.bucketName,
        Key: fileName,
      },
    };
    console.log(params);
    let uploader = this.client().uploadFile(params);
    uploader.on('error', function(err) {
      console.error("unable to upload:", err.stack);
    });
    uploader.on('progress', function() {
      console.log("progress", uploader.progressMd5Amount,
                uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
      console.log("done uploading");
    });

  }

  afterUpload() {
    this.serverless.cli.log('Thanks!');
  }
}

module.exports = ServerlessDataGenerate;
