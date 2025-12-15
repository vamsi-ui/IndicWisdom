import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { WisdomResponse } from '../types';
import { Download, X, Share2, Copy } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface FlashCardProps {
    response: WisdomResponse;
    onClose: () => void;
}

export const FlashCard: React.FC<FlashCardProps> = ({ response, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleShare = async () => {
        if (!cardRef.current) return;

        let canvas: HTMLCanvasElement | null = null;
        try {
            // 1. Generate Image
            canvas = await html2canvas(cardRef.current, {
                scale: 2, // High res
                backgroundColor: null,
                logging: false,
                useCORS: true // Ensure fonts/images load
            });
            const dataUrl = canvas.toDataURL('image/png');

            // 2. Share via Web Share API or Native Share
            if (Capacitor.isNativePlatform()) {
                // Native Share (Android/iOS)
                // We need to write the file to the filesystem to share the IMAGE, 
                // but the standard Share plugin often just shares text/url unless we pass a file path.
                // For simplicity/reliability in this context without complex FS operations:
                await Share.share({
                    title: 'IndicWisdom',
                    text: `"${response.content}"\n\n- via IndicWisdom`,
                    url: 'https://indic-wisdom.app', // Optional context
                    dialogTitle: 'Share Wisdom',
                });

                // Note: To share the ACTUAL IMAGE on native, we'd need @capacitor/filesystem to write base64 to cache, then share that URI.
                // If the user REALLY wants the image shared on Android, we need Filesystem. 
                // Given the constraints and likely error points, we'll prioritizing text share on native for now 
                // OR we can try to rely on the 'files' supported depending on plugin version.

            } else {
                // Web: Browser Share API
                if (navigator.share) {
                    // Try sharing the file object if supported
                    try {
                        const blob = await (await fetch(dataUrl)).blob();
                        const file = new File([blob], 'wisdom-card.png', { type: 'image/png' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: 'IndicWisdom',
                                text: 'Check out this wisdom from IndicWisdom!'
                            });
                            return; // Success
                        }
                    } catch (err) {
                        console.warn("File share not supported, trying text share", err);
                    }

                    // Fallback to text share if file share fails
                    await navigator.share({
                        title: 'IndicWisdom',
                        text: `"${response.content}" - IndicWisdom`,
                        url: window.location.href
                    });
                } else {
                    // Desktop/Fallback: Download
                    const link = document.createElement('a');
                    link.download = 'wisdom-card.png';
                    link.href = dataUrl;
                    link.click();
                }
            }
        } catch (e) {
            console.error("Sharing failed", e);
            // Only try to download if we actually have a canvas
            if (canvas) {
                try {
                    const link = document.createElement('a');
                    link.download = 'wisdom-card.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } catch (err2) {
                    console.error("Even fallback download failed", err2);
                }
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
        >
            <div className="relative w-full max-w-md">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/80 hover:text-white p-2"
                >
                    <X size={24} />
                </button>

                {/* The Card to Caption */}
                <div
                    ref={cardRef}
                    className="
             bg-white
             relative overflow-hidden
             p-8 rounded-[1.5rem] text-center 
             shadow-2xl shadow-black/20
             border-4 border-teal-500
           "
                >
                    {/* Watermark / Background Elements */}
                    <div className="absolute inset-0 opacity-[0.03] bg-repeat space-y-4 pointer-events-none flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-teal-900 rotate-45">INDIC WISDOM</span>
                        <span className="text-4xl font-bold text-teal-900 rotate-45">INDIC WISDOM</span>
                        <span className="text-4xl font-bold text-teal-900 rotate-45">INDIC WISDOM</span>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo Area */}
                        <div className="mb-6 rounded-full p-1 border-2 border-teal-100">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                        </div>

                        <h3 className="text-teal-600 tracking-[0.2em] text-[10px] font-bold uppercase mb-6">
                            IndicWisdom
                        </h3>

                        <div className="font-serif text-2xl leading-relaxed text-stone-800 mb-8 font-medium">
                            "{response.content}"
                        </div>

                        <div className="w-12 h-1 bg-teal-500 rounded-full mb-6" />

                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                                Generated by AI
                            </p>
                            <p className="text-[8px] text-stone-300">
                                indic-wisdom.app
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center gap-4">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 hover:shadow-lg transition-all"
                    >
                        <Share2 size={18} />
                        Share Card
                    </button>
                    <button
                        onClick={handleShare} // Dual handling for now, can separate if needed
                        className="flex items-center gap-2 px-6 py-3 bg-white text-stone-600 rounded-full font-bold hover:bg-stone-50 transition-colors"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
