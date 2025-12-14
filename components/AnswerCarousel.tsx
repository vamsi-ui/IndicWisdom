import React, { useState, useRef } from 'react';
import { WisdomResponse, Language } from '../types';
import { Icons } from '../constants';
import { fetchSpeech } from '../services/geminiService';

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
        const base64Audio = await fetchSpeech(text);
        if (base64Audio) {
            const source = await playRawAudio(base64Audio);
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
        alert("Audio unavailable for this answer. Please try another.");
    }
  };

  const handleShare = async (text: string) => {
    const shareData = {
      title: 'IndicWisdom',
      text: `${text}\n\n- Shared via IndicWisdom App`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const currentAnswer = answers[currentIndex];

  if (!currentAnswer) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      {/* Tabs / Indicators */}
      <div className="flex justify-center space-x-2 mb-4 overflow-x-auto no-scrollbar py-2">
        {answers.map((ans, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
              currentIndex === idx
                ? 'bg-orange-600 text-white'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            {ans.persona}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl shadow-xl overflow-hidden border border-stone-100 dark:border-stone-800 min-h-[300px] flex flex-col transition-colors duration-300">
        {/* Card Header */}
        <div className="bg-indigo-900 dark:bg-indigo-950 px-6 py-4 flex justify-between items-center z-10 relative">
            <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Icons.Sparkles className="w-4 h-4 text-yellow-400" />
                    {currentAnswer.persona} Answer
                </h3>
                <p className="text-indigo-200 text-xs">{currentAnswer.modelName}</p>
            </div>
            <div className="text-indigo-300 text-xs font-mono bg-indigo-800 dark:bg-indigo-900 px-2 py-1 rounded">
                AI Generated
            </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow flex items-center justify-center relative z-10">
            <p className="text-xl text-stone-800 dark:text-stone-100 leading-relaxed font-medium text-center pb-8">
                {currentAnswer.content}
            </p>
        </div>

        {/* Watermark Logo (Bottom Right) */}
        {logoUrl && (
            <div className="absolute bottom-16 right-4 z-20 opacity-90">
                <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-12 h-12 rounded-2xl shadow-sm object-cover" 
                />
            </div>
        )}

        {/* Background Watermark Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-5xl font-extrabold text-stone-100 dark:text-stone-800 uppercase -rotate-12 opacity-50 select-none">
                IndicWisdom
            </span>
        </div>

        {/* Action Bar */}
        <div className="border-t border-stone-100 dark:border-stone-800 p-4 bg-stone-50 dark:bg-stone-950 flex justify-between items-center z-10 relative transition-colors duration-300">
             <button
                onClick={() => handleSpeak(currentAnswer.content)}
                disabled={isLoadingAudio || isPlaying}
                className={`flex items-center space-x-2 transition-colors ${
                    isLoadingAudio || isPlaying ? 'text-orange-400' : 'text-stone-600 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-500'
                }`}
             >
                 {isLoadingAudio ? (
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                 ) : (
                    <Icons.Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                 )}
                 <span className="text-sm font-medium">
                    {isLoadingAudio ? 'Loading...' : isPlaying ? 'Playing...' : 'Listen'}
                 </span>
             </button>

             <button
                onClick={() => handleShare(currentAnswer.content)}
                className="flex items-center space-x-2 text-stone-600 dark:text-stone-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
             >
                 <Icons.Share2 className="w-5 h-5" />
                 <span className="text-sm font-medium">Share</span>
             </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-between mt-4 px-4 text-stone-400 dark:text-stone-500">
        <button onClick={handlePrev} className="hover:text-stone-800 dark:hover:text-stone-200">
            Prev
        </button>
        <button onClick={handleNext} className="hover:text-stone-800 dark:hover:text-stone-200">
            Next
        </button>
      </div>
    </div>
  );
};

export default AnswerCarousel;