import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
	aws_apigatewayv2 as apigwv2,
	aws_certificatemanager as acm,
	aws_cloudfront as cloudfront,
	aws_cloudfront_origins as origins,
	aws_iam as iam,
	aws_lambda_nodejs as nodejs,
	aws_route53 as route53,
	aws_route53_targets as targets,
	aws_s3 as s3,
	aws_s3_deployment as s3deploy,
	aws_secretsmanager as secretsmanager
} from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

interface MainStackProps extends cdk.StackProps {
	readonly zoneName: string;
}

export class MainStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: MainStackProps) {
		super(scope, id, props);

		// Hosted zone
		const apiZone = new route53.PublicHostedZone(this, "ApiZone", {
			zoneName: props.zoneName
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

		// new route53.CrossAccountZoneDelegationRecord(this, "ApiDevZoneDelegate", {
		// 	delegatedZone: apiZone,
		// 	parentHostedZoneName: "obs-chattalker.kaito.tokyo",
		// 	delegationRole
		// });

		// API Gateway
		const apiCertificate = new acm.Certificate(this, "ApiCertificate", {
			domainName: props.zoneName,
			validation: acm.CertificateValidation.fromDns(apiZone)
		});

		const httpApiDomainName = new apigwv2.DomainName(this, "ApiDoaminName", {
			domainName: props.zoneName,
			certificate: apiCertificate
		});

		new route53.ARecord(this, "ApiZoneAlias", {
			zone: apiZone,
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
		const obsDomainName = `obs.${props.zoneName}`;

		const obsBucket = new s3.Bucket(this, "ObsBucket");

		new s3deploy.BucketDeployment(this, "ObsBucketDeployment", {
			sources: [s3deploy.Source.asset("./assets/ObsBucket")],
			destinationBucket: obsBucket
		});

		const obsCertificate = new acm.Certificate(this, "ObsCertificate", {
			domainName: obsDomainName,
			validation: acm.CertificateValidation.fromDns(apiZone)
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
			certificate: obsCertificate,
			domainNames: [obsDomainName],
			errorResponses: [
				{
					httpStatus: 403,
					responsePagePath: "/404.html"
				}
			]
		});

		new route53.ARecord(this, "ObsZoneAlias", {
			zone: apiZone,
			recordName: "obs",
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
					HOST: props.zoneName
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
