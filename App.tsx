import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LANGUAGES, Icons } from './constants';
import { ProcessingState, WisdomResponse } from './types';
import VoiceInput from './components/VoiceInput';
import AnswerCarousel from './components/AnswerCarousel';
import { fetchWisdom } from './services/geminiService';

const App = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]); // Default Telugu
  const [inputText, setInputText] = useState('');
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [answers, setAnswers] = useState<WisdomResponse[]>([]);

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

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white shadow-sm p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                IW
            </div>
            <h1 className="text-xl font-bold text-stone-800 tracking-tight">IndicWisdom</h1>
          </div>
          
          <select
            value={selectedLanguage.code}
            onChange={(e) => {
              const lang = LANGUAGES.find((l) => l.code === e.target.value);
              if (lang) setSelectedLanguage(lang);
            }}
            className="bg-stone-100 border-none rounded-full px-4 py-2 text-sm font-medium text-stone-700 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md px-4 py-6 flex-grow flex flex-col">
        
        {/* Display User Query */}
        {inputText && (
          <div className="mb-6 animate-fade-in-up">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Your Question</h2>
            <div className="text-2xl font-medium text-stone-800 break-words font-serif">
              "{inputText}"
            </div>
          </div>
        )}

        {/* Input Area (Only show if not showing results or if explicit retry) */}
        {processingState.status === 'idle' && (
           <div className="flex-grow flex flex-col justify-center">
               <div className="text-center mb-8">
                   <h2 className="text-3xl font-bold text-stone-800 mb-2">Ask Anything.</h2>
                   <p className="text-stone-500">Ancient wisdom meets modern AI.</p>
               </div>
               
               <VoiceInput 
                 selectedLanguage={selectedLanguage} 
                 onTranscript={handleTranscript}
                 isProcessing={false}
               />

               <div className="relative mt-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-stone-50 text-stone-400">Or type it</span>
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
                        className="w-full pl-6 pr-12 py-4 rounded-xl shadow-sm border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none text-lg"
                    />
                    <button 
                        type="submit"
                        disabled={!inputText.trim()}
                        className="absolute right-2 top-2 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:bg-stone-300 transition-colors"
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
                <div className="absolute inset-0 border-4 border-stone-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
             </div>
             <div className="text-center">
                 <h3 className="text-lg font-semibold text-stone-800">Consulting the Sages...</h3>
                 <p className="text-stone-500 text-sm mt-1">Translating & Querying AI Models</p>
             </div>
          </div>
        )}

        {/* Results Area */}
        {processingState.status === 'success' && answers.length > 0 && (
          <div className="animate-fade-in-up">
            <AnswerCarousel answers={answers} language={selectedLanguage} />
            
            <button 
                onClick={() => {
                    setProcessingState({ status: 'idle' });
                    setInputText('');
                    setAnswers([]);
                }}
                className="w-full mt-8 py-3 bg-white border border-stone-200 text-stone-600 font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
                Ask Another Question
            </button>
          </div>
        )}

        {/* Error State */}
        {processingState.status === 'error' && (
            <div className="flex-grow flex flex-col items-center justify-center text-center">
                <div className="text-red-500 mb-4 bg-red-50 p-4 rounded-full">
                    <Icons.Sparkles className="w-8 h-8 rotate-45" /> 
                </div>
                <h3 className="text-lg font-bold text-stone-800">Wisdom Unreachable</h3>
                <p className="text-stone-500 mt-2 mb-6">{processingState.errorMessage}</p>
                <button 
                    onClick={() => setProcessingState({ status: 'idle' })}
                    className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900"
                >
                    Try Again
                </button>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;