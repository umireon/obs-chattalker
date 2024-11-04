#include "ChatTalkerContext.hpp"

#include <obs.h>

#include "plugin-support.h"

ChatTalkerContext::ChatTalkerContext(obs_data_t *settings,
				     obs_source_t *_source)
	: source(_source)
{
	update(settings);
}

ChatTalkerContext::~ChatTalkerContext(void) {}

obs_properties_t *ChatTalkerContext::getProperties(void)
{
	obs_properties_t *props = obs_properties_create();
	return props;
}

void ChatTalkerContext::update(obs_data_t *settings)
{
	UNUSED_PARAMETER(settings);
}

obs_audio_data *ChatTalkerContext::filterAudio(struct obs_audio_data *audio)
{
	return audio;
}
