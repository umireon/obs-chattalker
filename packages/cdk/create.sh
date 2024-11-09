#!/bin/bash

cd "$(dirname "$0")" || exit 1

npx cdk bootstrap --trust 147997151289
