# VF Coding Exercise

> This project deploys an s3 bucket, DynamoDB table, and labmda to AWS. It includes a plugin that generates and uploads a csv to the s3 bucket to then be inserted into the DynamoDB table by the lambda. It can be run locally. The lambda is designed to handle unexpected additional columns. The csv generation tests this by adding a random field each time it executes. 


## This Project Uses

- serverless-dynamodb-local
- serverless-offline
- @auth0/s3

## Using the Plugin

Clone or download this repository, then run npm.

```sh
$ npm install
```

Create a .env file like the example.env file and add the name of the s3 bucket you would like to use and the DynamoDB table you would like to create.

```yaml
DATA_BUCKET=your_unique_bucket_name
MESSAGES_TABLE=your_table_name
```

Deploy the stack.

```yaml
sls deploy
```
While it is deploying you can start your local DynamoDB instance in another terminal window.

```sh
$ sls dynamodb start --migrate
```
Once the stack has completed its deployment, execute the plugin. This will create a csv locally with the number of rows and file name specified and csv will be copied to the s3 bucket.

```sh
$ sls csv --rows 3 —file test
```

## Test locally

In `serverless.yml` change the `IS_OFFLINE` environment variable to `true` and invoke locally.

```sh
$ sls invoke local --function messageInsert -p ./localEvent.json
```

You can see the locally inserted data at http://localhost:8000/shell using the query:
(remember to user your table name)

```sh
var params = {
  TableName: 'your_unique_bucket_name',
  Select: 'ALL_ATTRIBUTES',
  ConsistentRead: false,
  ReturnConsumedCapacity: 'NONE',
};
dynamodb.scan(params, function(err, data) {
  if (err) ppJson(err); // an error occurred
  else ppJson(data); // successful response
});
```

### Note

Local execution relies on `localEvent.json`. If you named your csv something other than `test` you will need to change the `s3.object.key` parameter in `localEvent.json`.

## TODO

> Correctly configure the lambda function’s s3 event. I have not yet determined how to properly set the s3 event in `serverless.yml` so that putting the csv into the bucket triggers the lambda on AWS.