#include "SpeechSynthesis.hpp"

SpeechSynthesis::SpeechSynthesis(AVSpeechSynthesizer *__nonnull _synthesizer, const std::string &text) :
    synthesizer(_synthesizer),
    utterance([[AVSpeechUtterance alloc] initWithString:[[NSString alloc] initWithUTF8String:text.c_str()]])
{}

void SpeechSynthesis::synthesize(void) {}
