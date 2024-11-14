#!/bin/bash

cd "$(dirname "$0")" || exit 1

npm run cdk -- bootstrap \
  --trust arn:aws:iam::147997151289:role/ObsChatTalkerMainRole \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
