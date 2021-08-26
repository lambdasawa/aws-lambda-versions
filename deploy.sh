#!/bin/bash

set -xeu

function validate-versions() {
  versions_dir=$(mktemp -d)

  curl -s 'https://raw.githubusercontent.com/aws/aws-cdk/master/packages/%40aws-cdk/aws-lambda/lib/runtime.ts' |
    grep 'public static readonly' |
    sed -E 's/.*public static readonly ([^ ]*) .*/\1/g' |
    sort |
    uniq |
    grep -v ALL |
    grep -v FROM_IMAGE |
    grep -v DOTNET_CORE_1 |
    grep -ve 'DOTNET_CORE_2$' |
    grep -v GO_1_X |
    grep -ve 'NODEJS$' |
    grep -v NODEJS_4 |
    grep -v NODEJS_6 |
    grep -v NODEJS_8 |
    grep -v PROVIDED >$versions_dir/upstream-versions.txt

  curl -s https://raw.githubusercontent.com/lambdasawa/aws-lambda-versions/main/infra/lib/aws-lambda-versions-stack.ts |
    grep -e 'Runtime[^;]' |
    sed -E 's/.*lambda.Runtime.([^\,]*).*/\1/g' |
    sort |
    uniq >$versions_dir/current-versions.txt

  if diff $versions_dir/upstream-versions.txt $versions_dir/current-versions.txt; then
    echo 'runtime settings is ok'
  else
    echo 'please fix runtime settings' >&2
    exit 1
  fi
}

validate-versions

pushd $(pwd)
cd app/dotnet/src/MyFunction
for v in 2.1.813 3.1.406; do
  dotnet build -r $v
done
popd

pushd $(pwd)
cd app/java
gradle -i build
cd build/distributions
unzip -o java.zip
rm java.zip
popd

pushd $(pwd)
cd infra
npm i
npm run cdk -- deploy --all --require-approval never --events logs
popd
