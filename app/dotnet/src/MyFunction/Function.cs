using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Amazon.Lambda.Core;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MyFunction
{
  public class Function
  {

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input"></param>
    /// <param name="context"></param>
    /// <returns></returns>
    public async Task<string> FunctionHandler(object input, ILambdaContext context)
    {
      var client = new AmazonS3Client();
      await client.PutObjectAsync(new PutObjectRequest
      {
        BucketName = "aws-lambda-versions",
        Key = Environment.GetEnvironmentVariable("AWS_EXECUTION_ENV"),
        ContentBody = System.Environment.Version.ToString()
      });
      return "";
    }
  }
}
