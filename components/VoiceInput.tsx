import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons, APP_COLORS } from '../constants';
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
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
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

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setInterimText('');
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

  // Handle touch interactions for "Push to Talk" feel
  return (
    <div className="flex flex-col items-center justify-center w-full my-8">
       {/* Live Transcription Overlay */}
      <div className={`h-8 text-lg font-medium text-orange-700 dark:text-orange-400 transition-opacity duration-300 ${isListening ? 'opacity-100' : 'opacity-0'}`}>
        {interimText || (isListening ? 'Listening...' : '')}
      </div>

      <button
        className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all duration-200 transform active:scale-95 ${
          isListening ? 'bg-red-500 mic-active text-white' : 'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={(e) => {
          e.preventDefault(); // Prevent ghost clicks
          startListening();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopListening();
        }}
        disabled={isProcessing}
        aria-label="Hold to speak"
      >
        <Icons.Mic className="w-8 h-8" />
      </button>
      
      <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
        {isProcessing ? 'Processing wisdom...' : 'Hold to Speak'}
      </p>
    </div>
  );
};

export default VoiceInput;