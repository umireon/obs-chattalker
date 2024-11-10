#include "TwitchOauthClient.hpp"

#include <sstream>

#include <QDesktopServices>
#include <QUrl>

#include <obs.h>
#include "plugin-support.h"

#define TWITCH_CALLBACK_URI "https://apidev.obs-chattalker.kaito.tokyo/twitch/oauth/callback"
#define TWITCH_FINISHED_URI "https://obs.apidev.obs-chattalker.kaito.tokyo/twitch/oauth/finished"

#define TWITCH_CLIENT_ID "ijpjboz3v6rbxbalzqvtln0puk2md8"
#define TWITCH_SCOPE "chat:read"

#define THREAD_TICK 100
#define TIMEOUT 6000

TwitchOauthClient::TwitchOauthClient(void)
{
	tokenReceivingHttpServer.Get("/", [this](const httplib::Request &req,
						 httplib::Response &res) {
		handleGet(req, res);
	});
}

TwitchOauthClient::~TwitchOauthClient(void)
{
	stopThreads();
}

std::string TwitchOauthClient::buildAuthorizeURL(const std::string &state)
{
	std::ostringstream builder;

	builder << "https://id.twitch.tv/oauth2/authorize"
		   "?response_type=code"
		   "&client_id=" TWITCH_CLIENT_ID
		   "&redirect_uri=" TWITCH_CALLBACK_URI "&scope=" TWITCH_SCOPE
		   "&state="
		<< state;

	return builder.str();
}

void TwitchOauthClient::openAuthorizeScreen(int localPort)
{
	const std::string state = std::to_string(localPort);
	const std::string url = buildAuthorizeURL(state);
	obs_log(LOG_INFO, "Opening %s...", url.c_str());
	QDesktopServices::openUrl(QUrl(QString::fromStdString(url)));
}

int TwitchOauthClient::startTokenReceiver(void)
{
	stopThreads();

	tokenReceiverCleanupThread =
		std::thread([this]() { doCleanupThread(TIMEOUT); });

	int localPort = tokenReceivingHttpServer.bind_to_any_port("localhost");
	obs_log(LOG_INFO, "Listening on port %d for Twitch token");

	if (tokenReceiverThread.joinable()) {
		tokenReceiverThread.join();
	}

	tokenReceiverThread = std::thread(
		[this]() { tokenReceivingHttpServer.listen_after_bind(); });

	return localPort;
}

void TwitchOauthClient::handleGet(const httplib::Request &req,
				  httplib::Response &res)
{
	std::string accessToken;
	std::string expiresIn;
	std::string refreshToken;

	for (auto entry : req.params) {
		if (entry.first == "access_token") {
			accessToken = entry.second;
		} else if (entry.first == "expires_in") {
			expiresIn = entry.second;
		} else if (entry.first == "refresh_token") {
			refreshToken = entry.second;
		}
	}

	if (accessToken.empty() || expiresIn.empty() || refreshToken.empty()) {
		obs_log(LOG_WARNING, "Received message was invalid!");
		res.status = httplib::BadRequest_400;
		res.set_content(httplib::status_message(res.status),
				"text/plain");
	} else {
		obs_log(LOG_WARNING, "Twitch token received");
		res.set_redirect(TWITCH_FINISHED_URI);
	}
}

void TwitchOauthClient::doCleanupThread(long timeout)
{
	do {
		if (tokenReceiverStopping.load()) {
			break;
		}
		std::this_thread::sleep_for(
			std::chrono::milliseconds(THREAD_TICK));
		timeout -= 1;
	} while (timeout > 0);

	if (tokenReceivingHttpServer.is_running()) {
		tokenReceivingHttpServer.stop();
	}

	if (tokenReceiverThread.joinable()) {
		tokenReceiverThread.join();
	}

	obs_log(LOG_INFO, "Token receiver timeout: %d", timeout);

	tokenReceiverStopping.store(false);
}

void TwitchOauthClient::stopThreads(void)
{
	if (tokenReceiverCleanupThread.joinable()) {
		tokenReceiverStopping.store(true);
		std::this_thread::sleep_for(
			std::chrono::milliseconds(THREAD_TICK * 2));
		tokenReceiverCleanupThread.join();
	}
}
