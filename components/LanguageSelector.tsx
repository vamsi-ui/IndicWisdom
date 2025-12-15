import React from 'react';
import { motion } from 'framer-motion';
import { Language } from '../types';

interface LanguageSelectorProps {
    onSelect: (lang: Language) => void;
}

export const LANGUAGES: Language[] = [
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'en-IN', name: 'English', nativeName: 'English' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
            >
                <h1 className="text-3xl font-serif text-stone-800 dark:text-stone-100 italic">
                    Select your Wisdom Language
                </h1>
                <p className="text-stone-500 dark:text-stone-400">
                    Choose the language you wish to converse in
                </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl">
                {LANGUAGES.map((lang, index) => (
                    <motion.button
                        key={lang.code}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(20, 184, 166, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(lang)}
                        className="
              relative overflow-hidden group
              p-6 rounded-2xl border border-stone-200 dark:border-stone-800
              glass-panel hover:border-teal-500/50 transition-colors duration-300
              flex flex-col items-center justify-center gap-2
            "
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 to-teal-50/20 dark:from-teal-900/0 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <span className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                            {lang.nativeName}
                        </span>
                        <span className="text-sm text-stone-500 dark:text-stone-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {lang.name}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
