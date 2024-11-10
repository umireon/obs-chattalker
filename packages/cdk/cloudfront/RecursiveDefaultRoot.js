/**
 * @param {AWSCloudFrontFunction.Event} event
 * @returns {Promise<AWSCloudFrontFunction.Request>}
 */
async function handler(event) {
	const request = event.request;
	request.uri += "/index.html";
	return request;
}
