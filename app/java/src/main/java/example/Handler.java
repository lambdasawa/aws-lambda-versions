package example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import java.util.Map;

public class Handler implements RequestHandler<Map<String,String>, String>{
  @Override
  public String handleRequest(Map<String,String> event, Context context)
  {
    AmazonS3ClientBuilder
      .standard()
      .build()
      .putObject(
        "lambda-versions.com",
        System.getenv("AWS_EXECUTION_ENV"),
        System.getProperty("java.version")
      );

    return "";
  }
}
