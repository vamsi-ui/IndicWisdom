import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WisdomResponse, Language } from './types';
import { fetchWisdom, generateAppLogo, retrySingleModel } from './services/geminiService';
import { LanguageSelector, LANGUAGES } from './components/LanguageSelector'; // Ensure LANGUAGES export
import { InputSection } from './components/InputSection';
import { ResponseList } from './components/ResponseList';
import { FlashCard } from './components/FlashCard';
import { Onboarding } from './components/Onboarding';
import { RefreshCw, ArrowLeft, Sun, Moon, Globe } from 'lucide-react';

const App = () => {
    // State
    const [step, setStep] = useState<'onboarding' | 'language' | 'input' | 'processing' | 'results'>('onboarding');
    const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
    const [lastQuery, setLastQuery] = useState(''); // Store query for retry
    const [answers, setAnswers] = useState<WisdomResponse[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<WisdomResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [darkMode, setDarkMode] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);

    // Initial load - Check system or default to light, but allow toggle
    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
        }

        // Load saved language
        const savedLangCode = localStorage.getItem('indicWisdom_lang');
        if (savedLangCode) {
            const found = LANGUAGES.find(l => l.code === savedLangCode);
            if (found) {
                setSelectedLanguage(found);
                setStep('input');
            }
        }
    }, []);

    // Apply dark mode class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleLanguageSelect = (lang: Language) => {
        setSelectedLanguage(lang);
        localStorage.setItem('indicWisdom_lang', lang.code); // Save Preference
        setStep('input');
        setShowLangMenu(false);
    };

    const handleInputSend = async (text: string) => {
        if (!selectedLanguage) return;
        setLastQuery(text); // Save for retrying
        setStep('processing');
        setError(null);
        try {
            const results = await fetchWisdom(text, selectedLanguage.name);
            setAnswers(results);
            setStep('results');
        } catch (e: any) {
            setError(e.message || "Failed to fetch wisdom");
            setStep('input'); // Go back to input on error
        }
    };

    // Retry Logic
    const handleRetry = async (responseToRetry: WisdomResponse) => {
        if (!selectedLanguage || !lastQuery) return;

        // Optimistic UI Update: Show "Retrying..." text for specific card
        setAnswers(prev => prev.map(a =>
            (a.persona === responseToRetry.persona)
                ? { ...a, content: "Retrying..." }
                : a
        ));

        try {
            // Re-fetch using the new retry service method
            // We use the same persona and model name to refresh just that slot
            const newResp = await retrySingleModel(
                lastQuery,
                responseToRetry.modelName!,
                responseToRetry.persona,
                selectedLanguage.name
            );

            // Replace in state
            setAnswers(prev => prev.map(a =>
                (a.persona === responseToRetry.persona) ? newResp : a
            ));
        } catch (e) {
            console.error(e);
            setAnswers(prev => prev.map(a =>
                (a.persona === responseToRetry.persona) ? { ...a, content: "Retry failed. Try again." } : a
            ));
        }
    };



    const handleReset = () => {
        // Keep language selected, go back to input
        if (selectedLanguage) {
            setStep('input');
        } else {
            setStep('language');
        }
        setAnswers([]);
        setSelectedAnswer(null);
        setError(null);
    };

    const handleBack = () => {
        if (step === 'input') setStep('language');
        if (step === 'results') setStep('input');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden font-sans selection:bg-teal-500/30">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-teal-100 dark:border-slate-800 transition-all duration-300 shadow-sm">
                <div className="flex items-center gap-4">
                    {step !== 'onboarding' && step !== 'language' && (
                        <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        {/* Logo Image */}
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700">
                            <img src="/logo.png" alt="IndicWisdom" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-serif font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100 hidden sm:block">
                            IndicWisdom
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language Selector (Persistent in Header if past onboarding) */}
                    {step !== 'onboarding' && (
                        <div className="relative">
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors text-slate-700 dark:text-slate-300 text-sm font-medium"
                            >
                                <Globe size={16} />
                                <span className="hidden sm:inline">{selectedLanguage?.nativeName || 'Language'}</span>
                            </button>
                            {/* Simple Dropdown for switching lang */}
                            {showLangMenu && (
                                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1">
                                    <button onClick={() => { setStep('language'); setShowLangMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
                                        Change Language...
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'results' && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            <RefreshCw size={16} />
                            <span className="hidden sm:inline">Ask Again</span>
                        </button>
                    )}

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="pt-24 min-h-screen flex flex-col items-center relative px-4">
                <AnimatePresence mode='wait'>
                    {step === 'onboarding' && (
                        <motion.div
                            key="onboarding"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}
                            className="w-full"
                        >
                            <Onboarding onComplete={() => setStep('language')} />
                        </motion.div>
                    )}

                    {step === 'language' && (
                        <motion.div
                            key="language"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}
                            className="w-full"
                        >
                            <LanguageSelector onSelect={handleLanguageSelect} />
                        </motion.div>
                    )}

                    {step === 'input' && selectedLanguage && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, y: -50 }}
                            className="w-full flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500 font-bold mb-2">
                                    Ask anything
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400">in {selectedLanguage.name}</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <InputSection
                                onSend={handleInputSend}
                                isProcessing={false}
                                languageCode={selectedLanguage.code}
                            />
                        </motion.div>
                    )}

                    {step === 'processing' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center"
                        >
                            <div className="animate-spin text-teal-500 mb-4">
                                <RefreshCw size={48} />
                            </div>
                            <h3 className="text-xl font-serif animate-pulse text-slate-600 dark:text-slate-400">
                                Consulting the Sages...
                            </h3>
                        </motion.div>
                    )}

                    {step === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                            className="w-full"
                        >
                            <ResponseList
                                responses={answers}
                                onSelect={setSelectedAnswer}
                                onRetry={handleRetry}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Flash Card Overlay */}
            <AnimatePresence>
                {selectedAnswer && (
                    <FlashCard
                        response={selectedAnswer}
                        onClose={() => setSelectedAnswer(null)}
                    />
                )}
            </AnimatePresence>

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-gradients" />
        </div>
    );
};

export default App;