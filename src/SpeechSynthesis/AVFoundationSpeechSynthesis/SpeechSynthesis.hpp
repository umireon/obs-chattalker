#pragma once

#include <string>

#import <AVFoundation/AVFoundation.h>

class SpeechSynthesis {
public:
    SpeechSynthesis(AVSpeechSynthesizer * __nonnull _synthesizer, const std::string &text);
	void synthesize(void);
    
private:
    AVSpeechSynthesizer * __nonnull synthesizer;
    AVSpeechUtterance * __nonnull utterance;
};
