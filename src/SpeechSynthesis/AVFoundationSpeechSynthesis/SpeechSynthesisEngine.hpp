#pragma once

#import <AVFoundation/AVFoundation.h>

#include "SpeechSynthesis.hpp"

class SpeechSynthesis {
public:
    SpeechSynthesis(void);
    void synthesize(void);
private:
    AVSpeechSynthesizer *__nonnull synthesizer;
};
