#!/bin/bash

cd "$(dirname "$0")" || exit 1

npm run cdk -- bootstrap aws://586794439382/us-east-1 \
  --trust=arn:aws:iam::147997151289:role/Builders/ObsChatTalkerBuilderCodeBuildRole \
  --cloudformation-execution-policies=arn:aws:iam::aws:policy/AdministratorAccess
