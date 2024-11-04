#pragma once

#include <obs-module.h>

#ifdef __cplusplus
extern "C" {
#endif

const char *chattalker_get_name(void *unused);
void *chattalker_create(obs_data_t *settings, obs_source_t *source);
void chattalker_destroy(void *data);
void chattalker_get_defaults(obs_data_t *settings);
obs_properties_t *chattalker_get_properties(void *data);
void chattalker_update(void *data, obs_data_t *settings);

#ifdef __cplusplus
}
#endif
