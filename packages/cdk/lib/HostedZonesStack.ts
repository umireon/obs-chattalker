import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { aws_route53 as route53 } from "aws-cdk-lib";

interface MainStackProps extends cdk.StackProps {
	readonly zoneName: string;
	readonly deletationRoleArn: string;
	readonly parentHostedZoneName: string;
}

export class HostedZonesStack extends cdk.Stack {
	readonly apiZone: route53.PublicHostedZone;

	constructor(scope: Construct, id: string, props: MainStackProps) {
		super(scope, id, {
			...props,
			description: "Manage hosted zones for obs-chattalker"
		});

		this.apiZone = new route53.PublicHostedZone(this, "ApiZone", {
			zoneName: props.zoneName
		});

		const delegationRole = iam.Role.fromRoleArn(
			this,
			"ApidevZoneDelegationRole",
			props.deletationRoleArn
		);

		new route53.CrossAccountZoneDelegationRecord(this, "ApiDevZoneDelegate", {
			delegatedZone: this.apiZone,
			parentHostedZoneName: props.parentHostedZoneName,
			delegationRole
		});
	}
}
