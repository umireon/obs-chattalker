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

ChatTalkerContext::~ChatTalkerContext(void) {}

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

bool ChatTalkerContext::handleAuthTwitchClicked(obs_properties_t *props,
						obs_property_t *property)
{
	UNUSED_PARAMETER(props);
	UNUSED_PARAMETER(property);

	int localPort = twitchOauthClient.startTokenReceiver();
	twitchOauthClient.openAuthorizeScreen(localPort);

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
