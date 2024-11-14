#!/bin/bash

cd "$(dirname "$0")" || exit 1

npm run cdk -- deploy --require-approval never ObsChatTalkerMainStack
