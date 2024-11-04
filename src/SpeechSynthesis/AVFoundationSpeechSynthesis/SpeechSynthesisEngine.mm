#include "SpeechSynthesisEngine.hpp"

SpeechSynthesis::SpeechSynthesis(void) : synthesizer([[AVSpeechSynthesizer alloc] init]){
    
}

SpeechSynthesis::synthesize(void) {
    [synthesizer spe];
}
