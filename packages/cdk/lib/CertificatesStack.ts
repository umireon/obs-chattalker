import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { aws_certificatemanager as acm } from "aws-cdk-lib";

import { HostedZonesStack } from "./HostedZonesStack.js";

interface CertificatesStackProps extends cdk.StackProps {
	readonly hostedZones: HostedZonesStack;
	readonly apiDomainName: string;
	readonly obsDomainName: string;
}

export class CertificatesStack extends cdk.Stack {
	readonly apiCertificate: acm.Certificate;
	readonly obsCertificate: acm.Certificate;

	constructor(scope: Construct, id: string, props: CertificatesStackProps) {
		super(scope, id, props);

		this.apiCertificate = new acm.Certificate(this, "ApiCertificate", {
			domainName: props.apiDomainName,
			validation: acm.CertificateValidation.fromDns(props.hostedZones.apiZone)
		});

		this.obsCertificate = new acm.Certificate(this, "ObsCertificate", {
			domainName: props.obsDomainName,
			validation: acm.CertificateValidation.fromDns(props.hostedZones.apiZone)
		});
	}
}
