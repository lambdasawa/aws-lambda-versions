const AWS = require("aws-sdk");

const bucketName = "aws-lambda-versions";

exports.handler = async function (event, context) {
  await new AWS.S3()
    .putObject({
      Bucket: bucketName,
      Key: process.env.AWS_EXECUTION_ENV,
      Body: Buffer.from(process.version, "ascii"),
    })
    .promise();
};
