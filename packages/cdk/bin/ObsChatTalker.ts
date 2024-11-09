#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ObsChatTalkerStack } from "../lib/ObsChatTalkerStack.js";

const app = new cdk.App();

new ObsChatTalkerStack(app, "CdkStack", {
	env: {
		account: "586794439382",
		region: "us-east-1"
	}
});

app.synth();
