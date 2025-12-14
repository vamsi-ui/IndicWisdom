import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LANGUAGES, Icons } from './constants';
import { ProcessingState, WisdomResponse } from './types';
import VoiceInput from './components/VoiceInput';
import AnswerCarousel from './components/AnswerCarousel';
import { fetchWisdom, generateAppLogo } from './services/geminiService';

const App = () => {
  // App State
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]); // Default Telugu
  const [inputText, setInputText] = useState('');
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [answers, setAnswers] = useState<WisdomResponse[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  
  // Dark Mode State with Persistence
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('indicWisdomTheme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('indicWisdomTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Generate Logo on mount (or retrieve from storage)
  useEffect(() => {
    const savedLogo = localStorage.getItem('indicWisdomLogo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    } else {
      setIsGeneratingLogo(true);
      generateAppLogo()
        .then((url) => {
          setLogoUrl(url);
          try { localStorage.setItem('indicWisdomLogo', url); } catch(e) {}
        })
        .catch((err) => console.error("Logo generation skipped:", err))
        .finally(() => setIsGeneratingLogo(false));
    }
  }, []);

  const handleTranscript = (text: string) => {
    setInputText(text);
    handleSubmission(text);
  };

  const handleSubmission = async (text: string) => {
    if (!text.trim()) return;

    setProcessingState({ status: 'processing' });
    setAnswers([]); // Clear previous

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen flex flex-col`}>
      <div className="flex-grow flex flex-col items-center bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
        {/* Header */}
        <header className="w-full bg-white dark:bg-stone-900 shadow-sm p-4 sticky top-0 z-50 transition-colors duration-300 border-b dark:border-stone-800">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center shadow-sm relative">
                  {logoUrl ? (
                      <img src={logoUrl} alt="IW Logo" className="w-full h-full object-cover" />
                  ) : (
                      <div className={`w-full h-full bg-orange-600 flex items-center justify-center text-white font-bold ${isGeneratingLogo ? 'animate-pulse' : ''}`}>
                          {isGeneratingLogo ? '...' : 'IW'}
                      </div>
                  )}
              </div>
              <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">IndicWisdom</h1>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    aria-label="Toggle Dark Mode"
                >
                    {darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                </button>

                <select
                    value={selectedLanguage.code}
                    onChange={(e) => {
                    const lang = LANGUAGES.find((l) => l.code === e.target.value);
                    if (lang) setSelectedLanguage(lang);
                    }}
                    className="bg-stone-100 dark:bg-stone-800 border-none rounded-full px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer transition-colors"
                >
                    {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.nativeName}
                    </option>
                    ))}
                </select>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-md px-4 py-6 flex-grow flex flex-col">
          
          {/* Display User Query */}
          {inputText && (
            <div className="mb-6 animate-fade-in-up">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Your Question</h2>
              <div className="text-2xl font-medium text-stone-800 dark:text-stone-100 break-words font-serif">
                "{inputText}"
              </div>
            </div>
          )}

          {/* Input Area (Only show if not showing results or if explicit retry) */}
          {processingState.status === 'idle' && (
             <div className="flex-grow flex flex-col justify-center">
                 <div className="text-center mb-8">
                     <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2">Ask Anything.</h2>
                     <p className="text-stone-500 dark:text-stone-400">Ancient wisdom meets modern AI.</p>
                 </div>
                 
                 <VoiceInput 
                   selectedLanguage={selectedLanguage} 
                   onTranscript={handleTranscript}
                   isProcessing={false}
                 />

                 <div className="relative mt-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200 dark:border-stone-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-stone-50 dark:bg-stone-950 text-stone-400">Or type it</span>
                    </div>
                  </div>

                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSubmission(inputText); }}
                    className="mt-6 relative"
                  >
                      <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={`Ask in ${selectedLanguage.name}...`}
                          className="w-full pl-6 pr-12 py-4 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900 transition-all outline-none text-lg"
                      />
                      <button 
                          type="submit"
                          disabled={!inputText.trim()}
                          className="absolute right-2 top-2 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:bg-stone-700 transition-colors"
                      >
                          <Icons.Send className="w-5 h-5" />
                      </button>
                  </form>
             </div>
          )}

          {/* Loading State */}
          {processingState.status === 'processing' && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-6">
               <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-stone-200 dark:border-stone-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
               </div>
               <div className="text-center">
                   <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200">Consulting the Sages...</h3>
                   <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Translating & Querying AI Models</p>
               </div>
            </div>
          )}

          {/* Results Area */}
          {processingState.status === 'success' && answers.length > 0 && (
            <div className="animate-fade-in-up">
              <AnswerCarousel 
                  answers={answers} 
                  language={selectedLanguage} 
                  logoUrl={logoUrl || undefined} 
              />
              
              <button 
                  onClick={() => {
                      setProcessingState({ status: 'idle' });
                      setInputText('');
                      setAnswers([]);
                  }}
                  className="w-full mt-8 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                  Ask Another Question
              </button>
            </div>
          )}

          {/* Error State */}
          {processingState.status === 'error' && (
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                  <div className="text-red-500 mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-full">
                      <Icons.Sparkles className="w-8 h-8 rotate-45" /> 
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Wisdom Unreachable</h3>
                  <p className="text-stone-500 dark:text-stone-400 mt-2 mb-6">{processingState.errorMessage}</p>
                  <button 
                      onClick={() => setProcessingState({ status: 'idle' })}
                      className="px-6 py-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-900 dark:hover:bg-stone-600"
                  >
                      Try Again
                  </button>
              </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;