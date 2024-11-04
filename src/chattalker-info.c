#include "chattalker.h"

struct obs_source_info chattalker_info = {
	.id = "chattalker",
	.type = OBS_SOURCE_TYPE_FILTER,
	.output_flags = OBS_SOURCE_AUDIO,
	.get_name = chattalker_get_name,
	.create = chattalker_create,
	.destroy = chattalker_destroy,
	.get_properties = chattalker_get_properties,
	.update = chattalker_update,
};
