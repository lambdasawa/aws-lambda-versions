#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { AwsLambdaVersionsStack } from "../lib/aws-lambda-versions-stack";

const app = new cdk.App();
new AwsLambdaVersionsStack(app, "AwsLambdaVersionsStack");
