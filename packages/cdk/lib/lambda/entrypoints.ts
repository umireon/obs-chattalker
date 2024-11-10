import { type Handler } from "aws-lambda";

export const handleOauthCallback: Handler = async (event: any, context: any) => {
	console.log("event", event);
	console.log("context", context);
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: "Hello, World!"
		})
	};
};
