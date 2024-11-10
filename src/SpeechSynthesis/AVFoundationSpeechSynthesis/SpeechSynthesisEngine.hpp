#pragma once

#include <string>

#import <AVFoundation/AVFoundation.h>

#include "SpeechSynthesis.hpp"

class SpeechSynthesisEngine {
public:
	SpeechSynthesisEngine(void);
	SpeechSynthesis operator()(const std::string &text);

private:
	AVSpeechSynthesizer *__nonnull synthesizer;
};
