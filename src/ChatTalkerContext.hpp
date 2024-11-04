#pragma once

#include <obs.h>

class ChatTalkerContext {
	const obs_source_t *source;

public:
	ChatTalkerContext(obs_data_t *settings, obs_source_t *_source);
	~ChatTalkerContext(void);
	obs_properties_t *getProperties(void);
	void update(obs_data_t *settings);
	obs_source_frame *filterVideo(obs_source_frame *frame);
	obs_audio_data *filterAudio(obs_audio_data *audio);
};
