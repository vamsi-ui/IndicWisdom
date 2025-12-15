import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { Language } from '../types';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface VoiceInputProps {
  selectedLanguage: Language;
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ selectedLanguage, onTranscript, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const textRef = React.useRef(''); // Store latest text to avoid closure staleness
  const [hasPermission, setHasPermission] = useState(false);

  // Check Permissions on Mount
  useEffect(() => {
    const checkPerms = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await SpeechRecognition.checkPermissions();
          setHasPermission(status.speechRecognition === 'granted');
        } catch (e) {
          console.warn("Permission check failed", e);
        }
      }
    };
    checkPerms();
  }, []);

  const startListening = async () => {
    setInterimText('');
    textRef.current = '';
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await SpeechRecognition.requestPermissions();
        if (status.speechRecognition !== 'granted') return;

        await SpeechRecognition.start({
          language: selectedLanguage.code,
          maxResults: 2,
          prompt: "Speak your question...",
          partialResults: true,
          popup: false,
        });

        setIsListening(true);

        SpeechRecognition.addListener('partialResults', (data: any) => {
          const text = data.matches && data.matches.length > 0 ? data.matches[0] : '';
          if (text) {
            setInterimText(text);
            textRef.current = text;
          }
        });

      } else {
        // Web Fallback
        alert("This feature is optimized for the Android App. On web, standard input is preferred.");
      }
    } catch (e) {
      console.error("Start Error:", e);
      setIsListening(false);
    }
  };

  const stopAndSend = async () => {
    // 1. Capture text immediately from Ref
    const textToSend = textRef.current;

    // 2. Clear state immediately to show UI feedback
    setIsListening(false);

    // 3. Send if valid
    if (textToSend && textToSend.trim()) {
      onTranscript(textToSend);
    } else {
      // Fallback: If ref is empty but state wasn't? 
      // Just in case, try interimText
      if (interimText.trim()) onTranscript(interimText);
    }

    // 4. Cleanup background (Fire and Forget)
    try {
      if (Capacitor.isNativePlatform()) {
        SpeechRecognition.stop().catch(e => console.warn("Stop caught:", e));
        SpeechRecognition.removeAllListeners().catch(e => console.warn("RemoveListeners caught:", e));
      }
    } catch (e) {
      console.warn("Background Cleanup Error:", e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full mb-2">
      {/* Live Transcript Display */}
      {isListening && (
        <div className="mb-4 px-4 py-2 bg-stone-900/90 text-white rounded-2xl text-center min-w-[200px] animate-fade-in-up">
          <span className="text-xs text-stone-400 uppercase tracking-widest block mb-1">Live Transcript</span>
          <p className="text-lg font-medium">{interimText || "Listening..."}</p>
        </div>
      )}

      {/* Control Buttons */}
      {!isListening ? (
        <button
          onClick={startListening}
          disabled={isProcessing}
          className="flex items-center gap-2 bg-indic-teal text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Icons.Mic className="w-5 h-5" />
          <span>Start Listening</span>
        </button>
      ) : (
        <button
          onClick={stopAndSend}
          className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg animate-pulse hover:scale-105 active:scale-95 transition-all"
        >
          <div className="w-3 h-3 bg-white rounded-sm" />
          <span>Stop & Send</span>
        </button>
      )}
    </div>
  );
};

export default VoiceInput;