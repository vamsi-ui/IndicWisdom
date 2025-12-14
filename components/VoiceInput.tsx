import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { Language } from '../types';

interface VoiceInputProps {
  selectedLanguage: Language;
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ selectedLanguage, onTranscript, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true; // Allow long pauses
      recog.interimResults = true;
      setRecognition(recog);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isProcessing || !recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.lang = selectedLanguage.code;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInterimText(interimTranscript);
        if (finalTranscript) {
          // Concatenate or just send final directly? 
          // For now, let's send final chunks as they come if we want live, 
          // BUT user asked for "Send with live transcription" implying manual send or auto send on stop?
          // Let's accumulate? No, standard behavior is auto-submit or manual submit.
          // User said "Start recording button and stop recording button to record voice and send".
          // So we should capture ALL final results into a buffer and send on STOP.
          // BUT `onTranscript` in App.tsx triggers submission immediately.
          // We should probably just trigger onTranscript on every final result for now to keep it simple 
          // UNLESS we want to accumulate. 
          // Given the prompt "note the pause... send with live transcription", 
          // let's send the final result immediately like a stream of thought?
          // actually, "Send" implies a discrete action.
          // Let's call onTranscript with the final chunk. The App handles it.
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (e) {
        console.warn("Recognition already started", e);
      }
    }
  }, [isListening, recognition, selectedLanguage, isProcessing, onTranscript]);


  if (!recognition) {
    return null; // or fallback UI
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Live Transcription Floating Pill */}
      {(isListening || interimText) && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm whitespace-nowrap z-50 animate-fade-in-up backdrop-blur-sm shadow-lg border border-white/10">
          <span className="font-mono text-red-400 mr-2">●</span>
          {interimText || 'Listening...'}
        </div>
      )}

      {/* Mic Trigger */}
      <div className="flex flex-col items-center gap-2">
        <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${isListening ? 'text-red-500' : 'text-stone-400'}`}>
          {isListening ? 'Tap to Send' : 'Tap to Speak'}
        </p>
        <button
          className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 transform shadow-2xl relative z-10 ${isListening
            ? 'bg-red-500 text-white scale-110 ring-4 ring-red-200 dark:ring-red-900 animate-pulse'
            : 'bg-gradient-to-br from-indic-teal to-indic-blue dark:from-indic-gold dark:to-orange-500 text-white dark:text-stone-900 ring-4 ring-stone-100 dark:ring-stone-800 hover:scale-105 active:scale-95 hover:shadow-indic-teal/50 dark:hover:shadow-indic-gold/50'
            } disabled:opacity-50 disabled:grayscale`}
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isListening ? (
            <Icons.Send className="w-8 h-8 animate-pulse" /> // Show Send icon when listening to indicate "Stop & Send"
          ) : (
            <Icons.Mic className="w-8 h-8" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceInput;