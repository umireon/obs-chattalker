import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { aws_apigatewayv2 as apigwv2, aws_lambda_nodejs as nodejs } from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class MainStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
	}
}
