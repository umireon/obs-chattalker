import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
	aws_apigatewayv2 as apigwv2,
	aws_iam as iam,
	aws_lambda_nodejs as nodejs,
	aws_route53 as route53
} from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class MainStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const apiDevZone = new route53.PublicHostedZone(this, "ApiDevZone", {
			zoneName: "apidev.obs-chattalker.kaito.tokyo"
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
			delegatedZone: apiDevZone,
			parentHostedZoneName: "obs-chattalker.kaito.tokyo",
			delegationRole
		});

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
	}
}
