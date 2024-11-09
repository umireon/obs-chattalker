#!/bin/bash

cd "$(dirname "$0")" || exit 1

npx cdk deploy --require-approval never MainStack
