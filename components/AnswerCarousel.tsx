import React, { useState, useRef } from 'react';
import { WisdomResponse, Language } from '../types';
import { Icons } from '../constants';
import { fetchSpeech } from '../services/geminiService';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface AnswerCarouselProps {
  answers: WisdomResponse[];
  language: Language;
  logoUrl?: string;
}

// --- Audio Helper Functions for Raw PCM ---
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function playRawAudio(base64Data: string) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  const pcmData = base64ToUint8Array(base64Data);

  // Convert 16-bit PCM to float [-1, 1]
  const int16Data = new Int16Array(pcmData.buffer);
  const float32Data = new Float32Array(int16Data.length);
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }

  const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
  buffer.copyToChannel(float32Data, 0);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);

  return source;
}

const AnswerCarousel: React.FC<AnswerCarouselProps> = ({ answers, language, logoUrl }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % answers.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + answers.length) % answers.length);
  };

  const handleSpeak = async (text: string) => {
    if (isLoadingAudio || isPlaying) return;

    try {
      setIsLoadingAudio(true);
      // Pass the current language code for correct TTS accent
      const audioData = await fetchSpeech(text, language.code);

      if (audioData === 'NATIVE') {
        // It's already playing via Native TTS
        setIsLoadingAudio(false);
        setIsPlaying(true);
        // Simulate playing state duration based on length
        setTimeout(() => setIsPlaying(false), Math.min(text.length * 100, 10000));
        return;
      }

      if (audioData) {
        const source = await playRawAudio(audioData);
        setIsLoadingAudio(false);
        setIsPlaying(true);
        source.onended = () => setIsPlaying(false);
      } else {
        throw new Error("Empty audio data");
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsLoadingAudio(false);
      setIsPlaying(false);
      alert("Audio unavailable to play.");
    }
  };

  const handleShareImage = async () => {
    if (!cardRef.current) return;

    // Use html2canvas to snapshot the card
    // @ts-ignore
    if (!window.html2canvas) {
      const text = answers[currentIndex].content;
      try {
        await Share.share({
          title: 'IndicWisdom',
          text: text,
          url: 'https://indicwisdom.app'
        });
      } catch (e) {
        console.warn("Native share failed, fallback to clipboard", e);
        navigator.clipboard.writeText(text); alert("Copied text!");
      }
      return;
    }

    try {
      // @ts-ignore
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      const base64Data = canvas.toDataURL('image/png');

      if (Capacitor.isNativePlatform()) {
        // Native Share Logic (Filesystem + Share)
        const fileName = `wisdom_card_${Date.now()}.png`;
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data.split(',')[1], // Remove 'data:image/png;base64,'
          directory: Directory.Cache
        });

        await Share.share({
          title: 'IndicWisdom Card',
          text: 'Here is what the spirits said...',
          files: [savedFile.uri]
        });

      } else {
        // Web Share / Download Logic
        canvas.toBlob(async (blob: Blob | null) => {
          if (!blob) return;
          const file = new File([blob], 'indic-wisdom-share.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'IndicWisdom Card',
              text: 'Shared from IndicWisdom App'
            });
          } else {
            const a = document.createElement('a');
            a.href = base64Data;
            a.download = 'indic-wisdom-card.png';
            a.click();
          }
        });
      }

    } catch (err) {
      console.error("Share failed", err);
      alert("Could not share image.");
    }
  };

  const currentAnswer = answers[currentIndex];

  if (!currentAnswer) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      {/* Tabs / Indicators */}
      <div className="flex justify-center flex-wrap gap-2 mb-6 px-4">
        {answers.map((ans, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 transform hover:scale-105 ${currentIndex === idx
              ? 'bg-indic-teal text-white shadow-lg ring-2 ring-indic-gold/50'
              : 'bg-white dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700 hover:border-indic-teal'
              }`}
          >
            {ans.persona}
          </button>
        ))}
      </div>

      {/* Premium Card Design */}
      <div className="relative mx-4 perspective-1000">
        <div className="absolute -inset-1 bg-gradient-to-br from-indic-teal/30 to-indic-gold/30 rounded-[2rem] blur-lg opacity-70"></div>
        {/* Premium Card Design */}
        <div
          ref={cardRef}
          className="relative bg-white/80 dark:bg-stone-900/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/40 dark:border-white/10 flex flex-col items-center text-center h-[60vh] justify-between overflow-hidden"
        >
          {/* Decorative Gradient Blob */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indic-teal/10 dark:bg-indic-gold/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indic-orange/10 dark:bg-indic-orange/5 rounded-full blur-3xl" />
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indic-blue to-stone-900 px-6 py-5 flex justify-between items-center z-10 relative overflow-hidden">
            <div className="z-10">
              <h3 className="text-white font-serif font-bold text-xl flex items-center gap-2 tracking-wide">
                <Icons.Sparkles className="w-5 h-5 text-indic-gold" />
                {currentAnswer.persona}
              </h3>
              <p className="text-indic-teal/80 text-xs mt-0.5 uppercase tracking-widest font-sans font-medium">{currentAnswer.modelName}</p>
            </div>
            {/* Decorative Circle */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-indic-teal/20 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 w-full p-6 overflow-y-auto flex flex-col items-center justify-start relative scrollbar-hide">
            {/* Quotation Marks */}
            <div className="text-indic-gold/20 text-4xl font-serif font-black self-start mb-2">“</div>

            <p className="relative z-10 text-lg md:text-xl text-stone-700 dark:text-stone-200 leading-relaxed font-serif text-justify first-letter:text-3xl first-letter:font-bold first-letter:text-indic-teal">
              {currentAnswer.content}
            </p>

            <div className="text-indic-gold/20 text-4xl font-serif font-black self-end mt-2">”</div>
            <div className="mt-4 w-12 h-1 bg-gradient-to-r from-transparent via-indic-gold to-transparent opacity-50 shrink-0"></div>
          </div>

          {/* Watermark Logo */}
          <div className="absolute bottom-20 right-6 z-20 opacity-10 pointer-events-none">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-24 h-24 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {/* Action Bar - Floating Style */}
          <div data-html2canvas-ignore className="relative z-30 w-full p-4 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-stone-900 dark:via-stone-900/90 pt-8 flex gap-4 justify-center items-center">
            <button
              onClick={() => handleSpeak(currentAnswer.content)}
              disabled={isLoadingAudio || isPlaying}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold shadow-md active:scale-95 ${isLoadingAudio || isPlaying
                ? 'bg-indic-teal/10 text-indic-teal border border-indic-teal/20'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-indic-teal hover:text-indic-teal'
                }`}
            >
              {isLoadingAudio ? (
                <div className="w-5 h-5 border-2 border-indic-teal border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Icons.Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse text-indic-teal' : ''}`} />
              )}
              <span className="text-sm">{isPlaying ? 'Playing...' : 'Listen'}</span>
            </button>

            <button
              onClick={handleShareImage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indic-blue to-indic-teal text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
            >
              <Icons.Share2 className="w-5 h-5" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-between items-center mt-6 px-8 text-stone-400 dark:text-stone-600 font-serif italic text-sm">
        <button onClick={handlePrev} className="flex items-center gap-1 hover:text-indic-teal transition-colors">
          ← Previous Wisdom
        </button>
        <button onClick={handleNext} className="flex items-center gap-1 hover:text-indic-teal transition-colors">
          Next Wisdom →
        </button>
      </div>
    </div>
  );
};

export default AnswerCarousel;