#include "chattalker.h"

#include <new>

#include "plugin-support.h"
#include "ChatTalkerContext.hpp"

const char *chattalker_get_name(void *unused)
{
	UNUSED_PARAMETER(unused);
	return obs_module_text("ChatTalker");
}

void *chattalker_create(obs_data_t *settings, obs_source_t *source)
{
	void *data = bzalloc(sizeof(ChatTalkerContext));
	ChatTalkerContext *context = new (data)
		ChatTalkerContext(settings, source);
	return context;
}

void chattalker_destroy(void *data)
{
	ChatTalkerContext *context =
		reinterpret_cast<ChatTalkerContext *>(data);
	context->~ChatTalkerContext();
	bfree(data);
	return;
}

void chattalker_get_defaults(obs_data_t *settings)
{
	UNUSED_PARAMETER(settings);
}

obs_properties_t *chattalker_get_properties(void *data)
{
	ChatTalkerContext *context =
		reinterpret_cast<ChatTalkerContext *>(data);
	return context->getProperties();
}

void chattalker_update(void *data, obs_data_t *settings)
{
	ChatTalkerContext *context =
		reinterpret_cast<ChatTalkerContext *>(data);
	context->update(settings);
}
