import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

import { getSecret } from "@aws-lambda-powertools/parameters/secrets";
import { Logger } from "@aws-lambda-powertools/logger";

interface TwitchClientInfo {
	twitchClientId: string;
	twitchClientSecret: string;
}

interface OauthTokenResponse {
	readonly access_token: string;
	readonly expires_in: number;
	readonly refresh_token: string;
	readonly scope: string[];
	readonly token_type: "bearer";
}

const BadRequest = {
	statusCode: 400,
	body: "Bad Request!"
} as const satisfies APIGatewayProxyResultV2;

const InternalServerError = {
	statusCode: 400,
	body: "Bad Request!"
} as const satisfies APIGatewayProxyResultV2;

const logger = new Logger({
	serviceName: "ObsChatTalker"
});

export async function handleTwitchOauthCallback(
	event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
	if (!event.queryStringParameters) {
		logger.error("No query string parameters");
		return InternalServerError;
	}

	const {
		code: requestCode,
		state: requestState,
		scope: requestScope
	} = event.queryStringParameters;

	if (!requestCode || !requestState || !requestScope) {
		logger.warn("Missing query string parameters");
		return BadRequest;
	}

	if (!process.env["TWITCH_SECRET_NAME"] || !process.env["HOST"]) {
		logger.error("No Twitch secret ARN");
		return InternalServerError;
	}

	const twitchClientInfo: Partial<TwitchClientInfo> | undefined = await getSecret(
		process.env["TWITCH_SECRET_NAME"],
		{
			transform: "json"
		}
	);

	if (!twitchClientInfo) {
		logger.error("Failed to get Twitch client info");
		return InternalServerError;
	}

	const { twitchClientId, twitchClientSecret } = twitchClientInfo;

	if (!twitchClientId || !twitchClientSecret) {
		logger.error("Missing Twitch client info");
		return InternalServerError;
	}

	const body = new URLSearchParams({
		client_id: twitchClientId,
		client_secret: twitchClientSecret,
		code: requestCode,
		grant_type: "authorization_code"
	});

	const response = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		body
	});

	if (!response.ok) {
		logger.error("Failed to get Twitch OAuth token!");
		const text = await response.text();
		logger.error(text);
		return InternalServerError;
	}

	const json = await response.json();

	if (
		!(
			typeof json === "object" &&
			json != null &&
			"access_token" in json &&
			typeof json.access_token === "string" &&
			"expires_in" in json &&
			typeof json.expires_in === "number" &&
			"refresh_token" in json &&
			typeof json.refresh_token === "string"
		)
	) {
		logger.error("Invalid Twitch OAuth token response");
		return InternalServerError;
	}

	const { access_token, expires_in, refresh_token } = json;

	const deviceParams = new URLSearchParams({
		access_token,
		expires_in: expires_in.toString(),
		refresh_token,
		redirect_uri: `https//${process.env["HOST"]}${event.rawPath}?${event.rawQueryString}`
	});

	return {
		statusCode: 303,
		headers: {
			Location: `http://localhost:${requestState}?${deviceParams}`
		}
	};
}
