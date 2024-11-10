#include "SpeechSynthesisEngine.hpp"

SpeechSynthesisEngine::SpeechSynthesisEngine(void) : synthesizer([[AVSpeechSynthesizer alloc] init]) {}

SpeechSynthesis SpeechSynthesisEngine::operator()(const std::string &text)
{
    return {synthesizer, text};
}
