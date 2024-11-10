#include "ChatTalkerContext.hpp"

#include <thread>
#include <sstream>
#include <iostream>

#include <httplib.h>

#include <QDesktopServices>
#include <QUrl>

#include <obs-module.h>

#include "plugin-support.h"

ChatTalkerContext::ChatTalkerContext(obs_data_t *settings,
				     obs_source_t *_source)
	: source(_source)
{
	update(settings);
}

ChatTalkerContext::~ChatTalkerContext(void)
{
    authCodeReceiverDestroying.store(true);
	std::this_thread::sleep_for(std::chrono::milliseconds(200));
    if (authCodeReceiverCleanupThread.joinable()) {
        authCodeReceiverCleanupThread.join();
    }
}

bool handle_auth_twitch_clicked(obs_properties_t *props,
				obs_property_t *property, void *data)
{
	ChatTalkerContext *context =
		reinterpret_cast<ChatTalkerContext *>(data);
	return context->handleAuthTwitchClicked(props, property);
}

obs_properties_t *ChatTalkerContext::getProperties(void)
{
	obs_properties_t *props = obs_properties_create();

	obs_properties *authGroup = obs_properties_create();
	obs_properties_add_button2(authGroup, "authTwitch",
				   obs_module_text("AuthTwitch"),
				   handle_auth_twitch_clicked, this);
	obs_properties_add_group(props, "auth", obs_module_text("AuthGroup"),
				 OBS_GROUP_NORMAL, authGroup);

	return props;
}

#define TWITCH_CLIENT_ID "ijpjboz3v6rbxbalzqvtln0puk2md8"
#define TWITCH_REDIRECT_URI \
	"https://apidev.obs-chattalker.kaito.tokyo/twitch/oauth/callback"
#define TWITCH_SCOPE "chat:read"

bool ChatTalkerContext::handleAuthTwitchClicked(obs_properties_t *props,
						obs_property_t *property)
{
	UNUSED_PARAMETER(props);
	UNUSED_PARAMETER(property);

	if (authCodeReceiverThread.joinable()) {
        authCodeReceiverDestroying.store(true);
		std::this_thread::sleep_for(std::chrono::milliseconds(200));
        authCodeReceiverCleanupThread.join();
	}

	authCodeReceiverCleanupThread = std::thread([this]() {
		for (long timeout = 6000; timeout > 0 && !authCodeReceiverDestroying.load();
		     timeout -= 1) {
			std::this_thread::sleep_for(
				std::chrono::milliseconds(100));
            obs_log(LOG_INFO, "aaa");
		}

		if (authCodeReceiverServer.is_running()) {
			authCodeReceiverServer.stop();
		}

		if (authCodeReceiverThread.joinable()) {
			authCodeReceiverThread.join();
		}
        
        authCodeReceiverDestroying.store(false);
	});

	int port = 0;

	authCodeReceiverServer.Get("/", [&port](const httplib::Request &req,
						 httplib::Response &res) {
		std::string code;

		for (auto entry : req.params) {
			if (entry.first == "code") {
				code = entry.second;
			}
		}

		if (code.empty()) {
			res.status = httplib::BadRequest_400;
			res.set_content(httplib::status_message(res.status),
					"text/plain");
			obs_log(LOG_WARNING, "Authorization code is invalid!");
		} else {
			res.status = httplib::NoContent_204;
			obs_log(LOG_WARNING, "Authorization code is received");
		}
	});

	port = authCodeReceiverServer.bind_to_any_port("localhost");
	obs_log(LOG_INFO, "port: %d", port);

	authCodeReceiverThread = std::thread(
		[this]() { authCodeReceiverServer.listen_after_bind(); });

	std::ostringstream urlBuilder;
	urlBuilder << "https://id.twitch.tv/oauth2/authorize"
		      "?response_type=code"
		      "&client_id=" TWITCH_CLIENT_ID
		      "&redirect_uri=" TWITCH_REDIRECT_URI
		      "&scope=" TWITCH_SCOPE "&state="
		   << port;

	QUrl url(urlBuilder.str().c_str());

	QDesktopServices::openUrl(url);
	return true;
}

void ChatTalkerContext::update(obs_data_t *settings)
{
	UNUSED_PARAMETER(settings);
}

obs_audio_data *ChatTalkerContext::filterAudio(struct obs_audio_data *audio)
{
	return audio;
}
