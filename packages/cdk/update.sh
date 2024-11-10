#!/bin/bash

cd "$(dirname "$0")" || exit 1

npx aws-cdk deploy --require-approval never MainStack
