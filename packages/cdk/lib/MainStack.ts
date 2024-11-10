import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
	aws_apigatewayv2 as apigwv2,
	aws_iam as iam,
	aws_lambda_nodejs as nodejs,
	aws_route53 as route53,
	aws_route53_targets as targets,
	aws_certificatemanager as acm
} from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

interface MainStackProps extends cdk.StackProps {
	readonly zoneName: string;
}

export class MainStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: MainStackProps) {
		super(scope, id, props);

		const oauthCallbackFunction = new nodejs.NodejsFunction(this, "OauthCallbackFunction", {
			entry: "lib/lambda/entrypoints.ts",
			handler: "handleOauthCallback"
		});

		const httpApi = new apigwv2.HttpApi(this, "ObsChatTalkerApi");

		httpApi.addRoutes({
			path: "/oauth/callback",
			methods: [apigwv2.HttpMethod.GET],
			integration: new HttpLambdaIntegration("OauthCallback", oauthCallbackFunction)
		});

		const zone = new route53.PublicHostedZone(this, "ApiZone", {
			zoneName: props.zoneName
		});

		const certificate = new acm.Certificate(this, "ApiCertificate", {
			domainName: props.zoneName,
			certificateName: props.zoneName,
			validation: acm.CertificateValidation.fromDns(zone)
		});

		const httpApiDomainName = new apigwv2.DomainName(this, "ObsChatTalkerApiDoaminName", {
			domainName: props.zoneName,
			certificate
		});

		new route53.ARecord(this, "ApiZoneAlias", {
			zone,
			target: route53.RecordTarget.fromAlias(
				new targets.ApiGatewayv2DomainProperties(
					httpApiDomainName.regionalDomainName,
					httpApiDomainName.regionalHostedZoneId
				)
			)
		});

		const delegationRoleArn = this.formatArn({
			region: "",
			service: "iam",
			account: "913524900670",
			resource: "role",
			resourceName: `route53-delegation/apidev-${this.account}`
		});
		const delegationRole = iam.Role.fromRoleArn(
			this,
			"ApidevZoneDelegationRole",
			delegationRoleArn
		);

		new route53.CrossAccountZoneDelegationRecord(this, "ApiDevZoneDelegate", {
			delegatedZone: zone,
			parentHostedZoneName: "obs-chattalker.kaito.tokyo",
			delegationRole
		});
	}
}
