import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
	aws_apigatewayv2 as apigwv2,
	aws_cloudfront as cloudfront,
	aws_cloudfront_origins as origins,
	aws_lambda_nodejs as nodejs,
	aws_route53 as route53,
	aws_route53_targets as targets,
	aws_s3 as s3,
	aws_s3_deployment as s3deploy,
	aws_secretsmanager as secretsmanager
} from "aws-cdk-lib";

import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HostedZonesStack } from "./HostedZonesStack.js";
import { CertificatesStack } from "./CertificatesStack.js";

interface AppStackProps extends cdk.StackProps {
	readonly hostedZones: HostedZonesStack;
	readonly certificates: CertificatesStack;
	readonly apiDomainName: string;
	readonly obsDomainName: string;
}

export class AppStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: AppStackProps) {
		super(scope, id, props);

		// API Gateway
		const httpApiDomainName = new apigwv2.DomainName(this, "ApiDomainName", {
			domainName: props.apiDomainName,
			certificate: props.certificates.apiCertificate
		});

		new route53.ARecord(this, "ApiZoneAlias", {
			zone: props.hostedZones.apiZone,
			target: route53.RecordTarget.fromAlias(
				new targets.ApiGatewayv2DomainProperties(
					httpApiDomainName.regionalDomainName,
					httpApiDomainName.regionalHostedZoneId
				)
			)
		});

		const httpApi = new apigwv2.HttpApi(this, "httpApi", {
			defaultDomainMapping: {
				domainName: httpApiDomainName
			}
		});

		// OBS authorization finished screen
		const obsBucket = new s3.Bucket(this, "ObsBucket");

		new s3deploy.BucketDeployment(this, "ObsBucketDeployment", {
			sources: [s3deploy.Source.asset("./assets/ObsBucket")],
			destinationBucket: obsBucket
		});

		const recursiveDefaultRootFunction = new cloudfront.Function(
			this,
			"RecursiveDefaultRootFunction",
			{
				code: cloudfront.FunctionCode.fromFile({
					filePath: "cloudfront/RecursiveDefaultRoot.js"
				}),
				runtime: cloudfront.FunctionRuntime.JS_2_0
			}
		);

		const obsDistribution = new cloudfront.Distribution(this, "ObsDistribution", {
			defaultBehavior: {
				origin: origins.S3BucketOrigin.withOriginAccessControl(obsBucket),
				functionAssociations: [
					{
						function: recursiveDefaultRootFunction,
						eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
					}
				]
			},
			certificate: props.certificates.obsCertificate,
			domainNames: [props.obsDomainName],
			errorResponses: [
				{
					httpStatus: 403,
					responsePagePath: "/404.html"
				}
			]
		});

		new route53.ARecord(this, "ObsZoneAlias", {
			zone: props.hostedZones.apiZone,
			recordName: props.obsDomainName,
			target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(obsDistribution))
		});

		// Twitch OAuth callback function
		const twitchClientSecret = new secretsmanager.Secret(this, "TwitchOauthSecret", {
			secretObjectValue: {
				twitchClientId: cdk.SecretValue.unsafePlainText("ijpjboz3v6rbxbalzqvtln0puk2md8"),
				twitchClientSecret: cdk.SecretValue.unsafePlainText("")
			}
		});

		const twitchOauthCallbackFunction = new nodejs.NodejsFunction(
			this,
			"TwitchOauthCallbackFunction",
			{
				entry: "lambda/entry.ts",
				handler: "handleTwitchOauthCallback",
				environment: {
					TWITCH_SECRET_NAME: twitchClientSecret.secretName,
					HOST: props.apiDomainName
				}
			}
		);

		twitchClientSecret.grantRead(twitchOauthCallbackFunction);

		httpApi.addRoutes({
			path: "/twitch/oauth/callback",
			methods: [apigwv2.HttpMethod.GET],
			integration: new HttpLambdaIntegration("TwitchOauthCallback", twitchOauthCallbackFunction)
		});
	}
}
