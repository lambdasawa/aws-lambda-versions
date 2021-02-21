import boto3
import os
import sys


def handler(event, context):
    s3 = boto3.resource('s3')
    obj = s3.Object("aws-lambda-versions", os.getenv("AWS_EXECUTION_ENV"))
    obj.put(Body=sys.version)
