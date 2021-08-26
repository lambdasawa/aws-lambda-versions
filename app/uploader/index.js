const AWS = require("aws-sdk");

const bucketName = "lambda-versions.com";
const fileName = "versions.json";

exports.handler = async function (event, context) {
  const keys = await new AWS.S3()
    .listObjects({ Bucket: bucketName })
    .promise()
    .then((objects) => {
      return objects.Contents.map(({ Key }) => Key).filter((key) =>
        key.startsWith("AWS_Lambda_")
      );
    });

  const versions = Object.fromEntries(
    await Promise.all(
      keys.map((key) =>
        new AWS.S3()
          .getObject({ Bucket: bucketName, Key: key })
          .promise()
          .then(({ Body }) => {
            const value = Body.toString("utf-8");
            return [key, value];
          })
      )
    )
  );

  const previousVersions = await new AWS.S3()
    .getObject({ Bucket: bucketName, Key: fileName })
    .promise()
    .then(({ Body }) => {
      return JSON.parse(Body.toString("utf-8"));
    });

  if (
    Object.keys(previousVersions).length === Object.keys(versions).length &&
    Object.keys(versions).every(
      (key) => previousVersions[key] === versions[key]
    )
  ) {
    return; // prevent infinite loop
  }

  await new AWS.S3()
    .putObject({
      Bucket: bucketName,
      Key: fileName,
      Body: JSON.stringify(versions, null, 2),
      ContentType: "application/json; charset=utf-8",
    })
    .promise();
};
