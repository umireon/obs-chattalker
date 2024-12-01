#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { HostedZonesStack } from "../lib/HostedZonesStack.js";
import { CertificatesStack } from "../lib/CertificatesStack.js";
import { AppStack } from "../lib/AppStack.js";

const workloadAccountIds = { obsChatTalkerDev001: "586794439382" };

const app = new cdk.App();

const hostedZones = new HostedZonesStack(app, "HostedZonesStack", {
	env: {
		account: workloadAccountIds.obsChatTalkerDev001,
		region: "us-east-1"
	},
	zoneName: "apidev.obs-chattalker.kaito.tokyo.",
	deletationRoleArn: "arn:aws:iam::913524900670:role/route53-delegation/apidev-586794439382",
	parentHostedZoneName: "obs-chattalker.kaito.tokyo."
});

const certificates = new CertificatesStack(app, "CertificatesStack", {
	env: {
		account: workloadAccountIds.obsChatTalkerDev001,
		region: "us-east-1"
	},
	hostedZones,
	apiDomainName: "apidev.obs-chatalker.kaito.tokyo.",
	obsDomainName: "obs.apidev.obs-chatalker.kaito.tokyo.",
});

new AppStack(app, "AppStack", {
	env: {
		account: workloadAccountIds.obsChatTalkerDev001,
		region: "us-east-1"
	},
	hostedZones,
	certificates,
	apiDomainName: "apidev.obs-chatalker.kaito.tokyo.",
	obsDomainName: "obs.apidev.obs-chatalker.kaito.tokyo."
});

app.synth();
