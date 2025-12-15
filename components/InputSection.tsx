import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, StopCircle, RefreshCw } from 'lucide-react';

interface InputSectionProps {
    onSend: (text: string) => void;
    isProcessing: boolean;
    languageCode: string; // For Speech Recognition
}

export const InputSection: React.FC<InputSectionProps> = ({ onSend, isProcessing, languageCode }) => {
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = languageCode;

            recognitionRef.current.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setInputText(prev => {
                    // Simple approach: replace or append. 
                    // For continuous live feedback, let's just use the current final + interim.
                    // However, mixing manual edit + voice is tricky.
                    // Let's just set it for now.
                    return transcript;
                });
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                // Auto restart if still "listening" state? No, let manual control be better.
                if (isListening) setIsListening(false);
            };
        }
    }, [languageCode]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setInputText('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }
        onSend(inputText);
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[40vh]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full relative glass-panel rounded-3xl p-1 shadow-2xl shadow-teal-500/10"
            >
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask your question here..."}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none p-6 text-xl text-stone-800 dark:text-stone-100 placeholder-stone-400 min-h-[120px]"
                    disabled={isProcessing}
                />

                <div className="flex justify-between items-center px-4 pb-4">
                    {/* Voice Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleListening}
                        className={`p-4 rounded-full transition-all ${isListening
                            ? 'bg-red-100 text-red-600 animate-pulse'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                            }`}
                    >
                        {isListening ? <StopCircle size={24} /> : <Mic size={24} />}
                    </motion.button>

                    {/* Send Button */}
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        disabled={!inputText.trim() || isProcessing}
                        onClick={handleSend}
                        className={`
               flex items-center gap-2 px-6 py-3 rounded-full font-medium text-white shadow-lg transition-all
               ${!inputText.trim() || isProcessing
                                ? 'bg-stone-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:shadow-teal-500/25 active:scale-95'
                            }
             `}
                    >
                        {isProcessing ? (
                            <RefreshCw className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>Ask Wisdom</span>
                                <Send size={18} />
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            {/* Visualizer / Helper Text */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-teal-600 dark:text-teal-400 mt-4 text-center font-medium"
                    >
                        Listening... Speak clearly
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
