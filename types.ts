export interface Language {
  code: string; // ISO code for TTS/STT (e.g., 'te-IN')
  name: string; // Display name (e.g., 'Telugu')
  nativeName: string; // Native script (e.g., 'తెలుగు')
}

export interface WisdomResponse {
  persona: string;
  modelName: string;
  content: string;
  englishTranslation?: string; // Optional for debugging or user learning
}

export interface ProcessingState {
  status: 'idle' | 'listening' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

// Augment window for Web Speech API and AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AudioContext: any;
    webkitAudioContext: any;
  }
}
