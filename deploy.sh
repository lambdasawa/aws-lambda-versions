#!/bin/bash

set -xeu

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
