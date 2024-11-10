import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function handleTwitchOauthCallback(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
	if (!event.queryStringParameters) {
		return {
			statusCode: 400,
			body: "Bad Request!"
		}
	}

	if (!process.env["TWITCH_SECRET_ARN"]) {
		return {
			statusCode: 500,
			body: "Internal Server Error!"
		}
	}

	const client = new SecretsManagerClient();
	const response = await client.send(new GetSecretValueCommand({
		SecretId: process.env["TWITCH_SECRET_ARN"]
	}));

	// const { code, state, scope } = event.queryStringParameters; 

	// const formData = new URLSearchParams({
	// 	client_id: process.env.TWITCH_CLIENT_ID!,
	// 	client_secret: process.env.TWITCH_CLIENT_SECRET!,
	// 	code,
	// 	grant_type: "authorization_code",
	// 	redirect_uri: process.env.TWITCH_REDIRECT_URI!
	// });
	// fetch("https://id.twitch.tv/oauth2/token")
	
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: "Hello, World!"
		})
	};
}
