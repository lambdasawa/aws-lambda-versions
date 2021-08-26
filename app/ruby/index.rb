require 'aws-sdk-s3'

def handler(event:, context:)
  s3_client = Aws::S3::Client.new
  s3_client.put_object(
    bucket: 'lambda-versions.com',
    key: ENV['AWS_EXECUTION_ENV'],
    body: RUBY_VERSION
  )
end
