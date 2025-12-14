import React, { useState, useCallback, useRef } from 'react';
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
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (isProcessing) return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = selectedLanguage.code;
    recognition.continuous = false;
    recognition.interimResults = true;

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
        onTranscript(finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognition.start();
  }, [selectedLanguage.code, onTranscript, isProcessing]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full">
       {/* Live Transcription Floating Pill */}
      {isListening && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm whitespace-nowrap z-50 animate-fade-in-up backdrop-blur-sm">
             {interimText || 'Listening...'}
          </div>
      )}

      {/* Mic Trigger - Compact for Mobile Bottom Bar */}
      <div className="flex justify-center items-center gap-3">
        <p className="text-xs font-medium text-stone-400">Tap to speak</p>
        <button
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 transform active:scale-90 ${
            isListening ? 'bg-red-500 shadow-lg shadow-red-500/50 text-white animate-pulse' : 'bg-orange-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400'
            } disabled:opacity-50`}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={(e) => {
            e.preventDefault(); 
            startListening();
            }}
            onTouchEnd={(e) => {
            e.preventDefault();
            stopListening();
            }}
            disabled={isProcessing}
            aria-label="Hold to speak"
        >
            <Icons.Mic className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default VoiceInput;