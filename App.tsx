import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LANGUAGES, Icons } from './constants';
import { ProcessingState, WisdomResponse } from './types';
import VoiceInput from './components/VoiceInput';
import AnswerCarousel from './components/AnswerCarousel';
import { fetchWisdom, generateAppLogo } from './services/geminiService';

const App = () => {
    // --- Global State ---
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('indicWisdomTheme');
            if (saved === 'dark') return true;
            if (saved === 'light') return false;
            // Default to light mode for better branding on first visit
            return false;
        }
        return false;
    });

    const [hasOnboarded, setHasOnboarded] = useState(() => {
        return localStorage.getItem('hasOnboarded') === 'true';
    });

    // --- App Logic State ---
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
    const [inputText, setInputText] = useState('');
    const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
    const [answers, setAnswers] = useState<WisdomResponse[]>([]);
    // Use uploaded logo by default
    const [logoUrl, setLogoUrl] = useState<string | null>('/logo.png');

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem('indicWisdomTheme', darkMode ? 'dark' : 'light');
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // --- Handlers ---
    const handleTranscript = (text: string) => {
        setInputText(text);
        handleSubmission(text);
    };

    const handleSubmission = async (text: string) => {
        if (!text.trim()) return;

        setProcessingState({ status: 'processing' });

        try {
            const results = await fetchWisdom(text, selectedLanguage.name);
            setAnswers(results);
            setProcessingState({ status: 'success' });
        } catch (error) {
            setProcessingState({
                status: 'error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    const toggleDarkMode = () => setDarkMode(!darkMode);

    const completeOnboarding = (langCode: string) => {
        const lang = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
        setSelectedLanguage(lang);
        setHasOnboarded(true);
        localStorage.setItem('hasOnboarded', 'true');
    };

    return (
        <div className={`${darkMode ? 'dark' : ''} h-[100dvh] w-full overflow-hidden flex flex-col bg-stone-50 dark:bg-stone-950 transition-colors duration-300`}>
            {!hasOnboarded ? (
                <OnboardingFlow onComplete={completeOnboarding} />
            ) : (
                <MainApp
                    logoUrl={logoUrl}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    inputText={inputText}
                    setInputText={setInputText}
                    processingState={processingState}
                    answers={answers}
                    handleSubmission={handleSubmission}
                    handleTranscript={handleTranscript}
                    setProcessingState={setProcessingState}
                    setAnswers={setAnswers}
                />
            )}
        </div>
    );
};

// --- Sub-Components ---

const OnboardingFlow = ({ onComplete }: { onComplete: (code: string) => void }) => {
    const [step, setStep] = useState(0);
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0].code);

    const steps = [
        {
            title: "Namaste!",
            subtitle: "I am Arya.",
            desc: "I am here to bridge ancient wisdom with modern intelligence.",
            emotion: 'happy' as const,
            action: "Begin Journey"
        },
        {
            title: "Speak Your Heart",
            subtitle: "Choose a language",
            desc: "Select the language you are most comfortable conversing in.",
            emotion: 'neutral' as const,
            action: "Continue"
        },
        {
            title: "I Need to Listen",
            subtitle: "Microphone Access",
            desc: "To hear your questions and provide spoken wisdom, I need permission to use your microphone.",
            emotion: 'listening' as const,
            action: "Grant Access & Start"
        }
    ];

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.warn("Mic permission denied or ignored");
            }
            onComplete(selectedLang);
        } else {
            setStep(step + 1);
        }
    };

    const currentStep = steps[step];

    return (
        <div className="h-full flex flex-col items-center justify-between p-8 bg-stone-50 dark:bg-stone-950 text-center animate-fade-in-up">
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                {/* Arya The Guide (Restored) */}
                <div className="w-48 h-48 animate-bounce-slow">
                    <Icons.Sage className="w-full h-full drop-shadow-2xl" emotion={currentStep.emotion} />
                </div>

                <div className="space-y-4 max-w-xs">
                    <h1 className="text-3xl font-bold text-indic-blue dark:text-stone-100 font-serif">
                        {currentStep.title}
                    </h1>
                    <h2 className="text-lg font-medium text-indic-teal dark:text-indic-gold">
                        {currentStep.subtitle}
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                        {currentStep.desc}
                    </p>
                </div>

                {step === 1 && (
                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-4">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                className={`p-3 rounded-xl border-2 font-medium transition-all ${selectedLang === lang.code
                                    ? 'border-indic-teal bg-indic-teal/10 text-indic-teal dark:text-indic-gold dark:border-indic-gold'
                                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                                    }`}
                            >
                                {lang.nativeName}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={handleNext}
                className="w-full max-w-xs py-4 bg-indic-blue dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"
            >
                {currentStep.action}
            </button>
        </div>
    );
};

const MainApp = ({
    logoUrl, darkMode, toggleDarkMode, selectedLanguage, setSelectedLanguage,
    inputText, setInputText, processingState, answers,
    handleSubmission, handleTranscript, setProcessingState, setAnswers
}: any) => {

    const contentRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (answers.length > 0 && contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [answers]);

    const aryaEmotion = processingState.status === 'processing' ? 'thinking' : processingState.status === 'listening' ? 'listening' : 'neutral';

    return (
        <>
            {/* --- Mobile Header --- */}
            <header className="flex-none bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800 px-4 py-3 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    {/* Rounded Logo with subtle border */}
                    <div className="h-10 w-10 rounded-full bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center">
                        <img src={logoUrl || '/logo.png'} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                    {/* Title */}
                    <span className="font-bold text-indic-blue dark:text-stone-200 tracking-tight hidden sm:block">IndicWisdom</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleDarkMode} className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                        {darkMode ? '🌙' : '☀️'}
                    </button>
                    <LanguageSelector
                        selected={selectedLanguage}
                        onChange={setSelectedLanguage}
                    />
                </div>
            </header>

            {/* --- Scrollable Content Area --- */}
            <main ref={contentRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32">

                {/* Empty State / Welcome - Restore Arya Here Too */}
                {processingState.status === 'idle' && answers.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
                        <div className="w-40 h-40 opacity-90 animate-float">
                            <Icons.Sage className="w-full h-full" />
                        </div>
                        <div>
                            <h3 className="text-xl font-medium text-indic-blue dark:text-stone-300">Namaste.</h3>
                            <p className="text-sm text-stone-500 max-w-[250px] mx-auto mt-2">
                                I am ready to explore the depths of knowledge with you in {selectedLanguage.name}.
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading Indicator */}
                {processingState.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
                        <div className="w-24 h-24">
                            <Icons.Sage className="w-full h-full" emotion="thinking" />
                        </div>
                        <p className="text-indic-teal dark:text-indic-gold font-medium">Contemplating...</p>
                    </div>
                )}

                {/* Error */}
                {processingState.status === 'error' && (
                    <div className="mx-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-center animate-fade-in-up">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Something went wrong</p>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">"{processingState.errorMessage}"</p>
                        <button
                            onClick={() => setProcessingState({ status: 'idle' })}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-200 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Results */}
                {processingState.status === 'success' && answers.length > 0 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-center text-sm font-semibold text-stone-400 mb-4 uppercase tracking-widest">
                            Wisdom for "{inputText}"
                        </h2>
                        <AnswerCarousel
                            answers={answers}
                            language={selectedLanguage}
                            logoUrl={logoUrl || undefined}
                        />
                        <div className="h-8" />
                    </div>
                )}
            </main>

            {/* --- Sticky Bottom Input Area --- */}
            <div className="flex-none bg-white/80 dark:bg-stone-900/80 backdrop-blur-lg border-t border-stone-100 dark:border-stone-800 p-4 pb-8 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] dark:shadow-none z-30 rounded-t-[2rem] transition-all duration-300">

                {/* Guide Indicator */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white dark:bg-stone-800 px-4 py-1.5 rounded-full shadow-lg border border-indic-teal/20 dark:border-stone-700 flex items-center gap-2">
                        <Icons.Sage className="w-5 h-5" emotion={aryaEmotion} />
                        <span className="text-xs font-serif italic text-stone-500 dark:text-stone-400">Arya is {processingState.status === 'processing' ? 'thinking...' : 'ready'}</span>
                    </div>
                </div>

                <div className="mb-4 mt-2">
                    <VoiceInput
                        selectedLanguage={selectedLanguage}
                        onTranscript={handleTranscript}
                        isProcessing={processingState.status === 'processing'}
                    />
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); handleSubmission(inputText); }}
                    className="relative flex items-center group"
                >
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Ask anything in ${selectedLanguage.name}...`}
                        className="w-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-6 py-4 pr-14 rounded-2xl outline-none border-2 border-transparent focus:border-indic-teal/30 dark:focus:border-indic-gold/30 focus:bg-white dark:focus:bg-stone-950 transition-all font-medium placeholder:text-stone-400 shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || processingState.status === 'processing'}
                        className="absolute right-2 p-2.5 bg-indic-blue dark:bg-white text-white dark:text-stone-900 rounded-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 shadow-md"
                    >
                        <Icons.Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </>
    );
};

// --- Language Selector (Classic Compact Dropdown) ---
const LanguageSelector = ({ selected, onChange }: { selected: any, onChange: (l: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 text-indic-blue dark:text-stone-200 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 shadow-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
                <span className="text-xs font-bold uppercase tracking-wider">{selected.code.split('-')[0]}</span>
                <span className="font-serif font-medium">{selected.nativeName.split(' ')[0]}</span>
                <Icons.ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'} opacity-50`} />
            </button>

            {/* Compact Floating Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden animate-fade-in-up origin-top-right"
                >
                    <div className="py-1">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => { onChange(lang); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${selected.code === lang.code
                                    ? 'text-indic-teal dark:text-indic-gold font-bold bg-indic-teal/5 dark:bg-indic-gold/5'
                                    : 'text-stone-600 dark:text-stone-300'
                                    }`}
                            >
                                <span className="font-serif text-sm">{lang.nativeName}</span>
                                {selected.code === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;