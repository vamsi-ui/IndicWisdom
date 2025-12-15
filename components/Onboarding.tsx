import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Globe, Shield } from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const steps = [
        {
            icon: <Sparkles size={40} className="text-teal-500" />,
            title: "Ancient Wisdom, Modern Tech",
            desc: "Access insights from 8 distinct AI minds, trained on Indian culture and philosophy."
        },
        {
            icon: <Globe size={40} className="text-emerald-500" />,
            title: "In Your Language",
            desc: "Ask and receive wisdom in English, Hindi, Tamil, Telugu, and more."
        },
        {
            icon: <Shield size={40} className="text-cyan-500" />,
            title: "Private & Secure",
            desc: "Your quest for knowledge remains private. No personal data is stored."
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 max-w-lg mx-auto text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-12 relative"
            >
                <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full" />
                <img src="/logo.png" alt="Logo" className="w-32 h-32 relative z-10 drop-shadow-2xl" />
            </motion.div>

            <div className="space-y-8 w-full">
                {steps.map((step, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.2 }}
                        className="flex items-center gap-4 bg-white/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-teal-100 dark:border-stone-700 backdrop-blur-sm"
                    >
                        <div className="p-3 bg-white dark:bg-stone-900 rounded-xl shadow-sm">
                            {step.icon}
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-stone-800 dark:text-stone-100">{step.title}</h3>
                            <p className="text-sm text-stone-600 dark:text-stone-400">{step.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onComplete}
                className="mt-12 group relative px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 transition-all flex items-center gap-2"
            >
                Start Your Journey
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
        </div>
    );
};
