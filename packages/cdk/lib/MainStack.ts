import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { aws_lambda_nodejs as nodejs } from "aws-cdk-lib";

export class MainStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		new nodejs.NodejsFunction(this, "OAuthCallbackLambda", {
			entry: "lib/lambda/entrypoints.ts",
			handler: "handleOauthCallback"
		});
	}
}
