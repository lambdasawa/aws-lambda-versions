import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3n from "@aws-cdk/aws-s3-notifications";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as route53 from "@aws-cdk/aws-route53";

type LambdaDirectory =
  | "nodejs"
  | "python3"
  | "python2"
  | "ruby"
  | "dotnet"
  | "java";

type Function = {
  name: string;
  runtime: lambda.Runtime;
  directory: LambdaDirectory;
  subDirectory?: string;
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
    name: "Python39Function",
    runtime: lambda.Runtime.PYTHON_3_9,
    directory: "python3",
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
  {
    name: "Ruby27Function",
    runtime: lambda.Runtime.RUBY_2_7,
    directory: "ruby",
  },
  {
    name: "Ruby25Function",
    runtime: lambda.Runtime.RUBY_2_5,
    directory: "ruby",
  },
  {
    name: "DotNetCore31Function",
    runtime: lambda.Runtime.DOTNET_CORE_3_1,
    directory: "dotnet",
    subDirectory: "src/MyFunction/bin/Debug/netcoreapp3.1/3.1.406",
  },
  {
    name: "DotNetCore21Function",
    runtime: lambda.Runtime.DOTNET_CORE_2_1,
    directory: "dotnet",
    subDirectory: "src/MyFunction/bin/Debug/netcoreapp3.1/2.1.813",
  },
  {
    name: "Java11unction",
    runtime: lambda.Runtime.JAVA_11,
    directory: "java",
    subDirectory: "build/distributions",
  },
  {
    name: "Java8CorrettoFunction",
    runtime: lambda.Runtime.JAVA_8,
    directory: "java",
    subDirectory: "build/distributions",
  },
  /*
  {
    name: "Java8CorrettoFunction",
    runtime: lambda.Runtime.JAVA_8_CORRETTO,
    directory: "java",
    subDirectory: "build/distributions",
  },
  */
];

const handlers: Record<LambdaDirectory, string> = {
  nodejs: "index.handler",
  python3: "index.handler",
  python2: "index.handler",
  ruby: "index.handler",
  dotnet: "MyFunction::MyFunction.Function::FunctionHandler",
  java: "example.Handler::handleRequest",
};

export class AwsLambdaVersionsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "lambda-versions.com";

    const bucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: domainName,
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

    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName,
    });

    const aRecord = new route53.ARecord(this, "AliasRecord", {
      zone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new alias.BucketWebsiteTarget(bucket)
      ),
    });

    const jsonUploaderFunc = new lambda.Function(this, "UploadJsonFunction", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "app", "uploader")
      ),
    });

    bucket.grantReadWrite(jsonUploaderFunc);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(jsonUploaderFunc)
    );

    functions.forEach((f) => {
      const func = new lambda.Function(this, f.name, {
        runtime: f.runtime,
        handler: handlers[f.directory],
        code: lambda.Code.fromAsset(
          path.join(
            ...[
              __dirname,
              "..",
              "..",
              "app",
              f.directory,
              f.subDirectory,
            ].filter((p): p is string => Boolean(p))
          )
        ),
        timeout: cdk.Duration.minutes(1),
        memorySize: 512,
      });

      bucket.grantReadWrite(func);

      new events.Rule(this, `${f.name}EventRule`, {
        schedule: events.Schedule.rate(cdk.Duration.hours(1)),
        targets: [new targets.LambdaFunction(func)],
      });
    });
  }
}
