import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as path from "path";
import * as cdk from "@aws-cdk/core";

const bucketName = "aws-lambda-versions";

type LambdaDirectory = "nodejs" | "python3" | "python2";

type Function = {
  name: string;
  runtime: lambda.Runtime;
  directory: LambdaDirectory;
};

const functions: Function[] = [
  {
    name: "NodeJs14Function",
    runtime: lambda.Runtime.NODEJS_14_X,
    directory: "nodejs",
  },
  {
    name: "NodeJs12Function",
    runtime: lambda.Runtime.NODEJS_12_X,
    directory: "nodejs",
  },
  {
    name: "NodeJs10Function",
    runtime: lambda.Runtime.NODEJS_10_X,
    directory: "nodejs",
  },
  {
    name: "Python38Function",
    runtime: lambda.Runtime.PYTHON_3_8,
    directory: "python3",
  },
  {
    name: "Python37Function",
    runtime: lambda.Runtime.PYTHON_3_7,
    directory: "python3",
  },
  {
    name: "Python36Function",
    runtime: lambda.Runtime.PYTHON_3_6,
    directory: "python3",
  },
  {
    name: "Python27Function",
    runtime: lambda.Runtime.PYTHON_2_7,
    directory: "python2",
  },
];

const handlers: Record<LambdaDirectory, string> = {
  nodejs: "index.handler",
  python3: "index.handler",
  python2: "index.handler",
};

export class AwsLambdaVersionsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });

    const deployment = new s3Deployment.BucketDeployment(
      this,
      "DeployIndexHtml",
      {
        sources: [
          s3Deployment.Source.asset(path.join(__dirname, "..", "..", "public")),
        ],
        prune: false,
        destinationBucket: bucket,
      }
    );

    functions.forEach((f) => {
      const func = new lambda.Function(this, f.name, {
        runtime: f.runtime,
        handler: handlers[f.directory],
        code: lambda.Code.fromAsset(
          path.join(__dirname, "..", "..", "app", f.directory)
        ),
        timeout: cdk.Duration.seconds(5),
      });

      bucket.grantReadWrite(func);

      new events.Rule(this, `${f.name}EventRule`, {
        schedule: events.Schedule.rate(cdk.Duration.hours(1)),
        targets: [new targets.LambdaFunction(func)],
      });
    });
  }
}
