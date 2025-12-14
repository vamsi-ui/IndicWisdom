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
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('indicWisdomTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const savedLogo = localStorage.getItem('indicWisdomLogo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    } else {
      generateAppLogo()
        .then((url) => {
          setLogoUrl(url);
          try { localStorage.setItem('indicWisdomLogo', url); } catch(e) {}
        })
        .catch((err) => console.error("Logo generation skipped:", err));
    }
  }, []);

  // --- Handlers ---
  const handleTranscript = (text: string) => {
    setInputText(text);
    handleSubmission(text);
  };

  const handleSubmission = async (text: string) => {
    if (!text.trim()) return;

    setProcessingState({ status: 'processing' });
    // Scroll to results eventually? 
    // For now, we keep answers in state.
    
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
             // Request mic permission just to trigger the prompt
             try {
                 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                 stream.getTracks().forEach(track => track.stop()); // Close immediately
             } catch(e) {
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
                {/* Arya The Guide */}
                <div className="w-40 h-40 animate-bounce-slow">
                    <Icons.Sage className="w-full h-full drop-shadow-2xl" emotion={currentStep.emotion} />
                </div>

                <div className="space-y-4 max-w-xs">
                    <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100 font-serif">
                        {currentStep.title}
                    </h1>
                    <h2 className="text-lg font-medium text-orange-600 dark:text-orange-400">
                        {currentStep.subtitle}
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                        {currentStep.desc}
                    </p>
                </div>

                {/* Step 2: Language Selection Specific UI */}
                {step === 1 && (
                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-4">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                className={`p-3 rounded-xl border-2 font-medium transition-all ${
                                    selectedLang === lang.code 
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' 
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
                className="w-full max-w-xs py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"
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

    // Auto scroll to bottom when answers change
    const contentRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (answers.length > 0 && contentRef.current) {
            contentRef.current.scrollTop = 0; // Reset scroll for new answers
        }
    }, [answers]);

    // Determine Arya's emotion
    const aryaEmotion = processingState.status === 'processing' ? 'thinking' : processingState.status === 'listening' ? 'listening' : 'neutral';

    return (
        <>
            {/* --- Mobile Header --- */}
            <header className="flex-none bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800 px-4 py-3 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg overflow-hidden bg-orange-100 dark:bg-stone-800">
                        {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-orange-500" />}
                     </div>
                     <span className="font-bold text-stone-800 dark:text-stone-200">IndicWisdom</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleDarkMode} className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {darkMode ? '🌙' : '☀️'}
                    </button>
                    {/* Compact Language Selector */}
                    <select 
                        value={selectedLanguage.code}
                        onChange={(e) => setSelectedLanguage(LANGUAGES.find(l => l.code === e.target.value))}
                        className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold py-2 px-3 rounded-full outline-none"
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>
            </header>

            {/* --- Scrollable Content Area --- */}
            <main ref={contentRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32">
                
                {/* Empty State / Welcome */}
                {processingState.status === 'idle' && answers.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
                         <div className="w-32 h-32 opacity-50">
                             <Icons.Sage className="w-full h-full" />
                         </div>
                         <div>
                             <h3 className="text-xl font-medium text-stone-700 dark:text-stone-300">Namaste.</h3>
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
                        <p className="text-orange-600 dark:text-orange-400 font-medium">Contemplating...</p>
                    </div>
                )}

                {/* Error */}
                {processingState.status === 'error' && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-center">
                        <p className="text-red-600 dark:text-red-400">{processingState.errorMessage}</p>
                        <button onClick={() => setProcessingState({status: 'idle'})} className="mt-2 text-sm underline text-red-700 dark:text-red-300">Try Again</button>
                    </div>
                )}

                {/* Results - Pass only one result set */}
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
                        <div className="h-8" /> {/* Spacer */}
                    </div>
                )}
            </main>

            {/* --- Sticky Bottom Input Area --- */}
            <div className="flex-none bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none z-30 rounded-t-3xl">
                
                {/* Guide Indicator */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border-2 border-orange-100 dark:border-stone-700 flex items-center justify-center">
                    <Icons.Sage className="w-8 h-8" emotion={aryaEmotion} />
                </div>

                {/* Voice Input Integration */}
                <div className="mb-2">
                     <VoiceInput 
                        selectedLanguage={selectedLanguage}
                        onTranscript={handleTranscript}
                        isProcessing={processingState.status === 'processing'}
                     />
                </div>

                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSubmission(inputText); }}
                    className="relative flex items-center"
                >
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Ask Arya in ${selectedLanguage.name}...`}
                        className="w-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-5 py-4 pr-14 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium placeholder:text-stone-400"
                    />
                    <button 
                        type="submit"
                        disabled={!inputText.trim() || processingState.status === 'processing'}
                        className="absolute right-2 p-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:scale-95 transition-transform disabled:opacity-50"
                    >
                        <Icons.Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </>
    );
};

export default App;