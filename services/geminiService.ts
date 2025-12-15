import { GoogleGenAI, Type, Schema } from '@google/genai';
import { WisdomResponse } from '../types';

// Helper to get a fresh client instance with the latest key
const getAIClient = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY in .env");
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Generates an app logo using Gemini 2.5 Flash Image (Free tier friendly).
 */
export const generateAppLogo = async (): Promise<string> => {
  try {
    const ai = getAIClient();
    // Prompt refined for cleaner edges and better UI integration
    const prompt = 'A professional mobile app logo for "IndicWisdom". A stylized, minimalist orange lotus flower or diya lamp icon. Vector art style, flat design, high contrast, completely isolated on a pure white background. No borders, no shadows, no text.';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error('Logo generation failed:', error);
    throw error;
  }
};

/**
 * Generates wisdom responses in the target Indic language.
 */
import { fetchGroqResponse } from './groqService';

/**
 * Generates wisdom responses by querying multiple AI models in parallel (Gemini + Groq).
 */
export const fetchWisdom = async (
  query: string,
  languageName: string
): Promise<WisdomResponse[]> => {
  try {
    // List of models requested by user (Mapped to valid Groq IDs)
    // NOTE: Logs indicate 'mixtral', 'gemma2', 'qwen' are decommissioned on this tier.
    // We map all to Llama 3.3 70B (Reliable) with distinct system personas to simulate diversity.
    const requestedModels = [
      { id: 'llama-3.3-70b-versatile', name: 'Qwen 32B (Simulated)', persona: 'Qwen' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', persona: 'Llama 8B' }, // Keeps using lighter model
      { id: 'llama-3.3-70b-versatile', name: 'Llama 4 Maverick (Simulated)', persona: 'Maverick' },
      { id: 'llama-3.3-70b-versatile', name: 'Kimi K2 (Simulated)', persona: 'Kimi' },
      { id: 'llama-3.3-70b-versatile', name: 'GPT OSS 120B (Simulated)', persona: 'GPT OSS' },
      { id: 'llama-3.3-70b-versatile', name: 'GPT OSS Safeguard (Simulated)', persona: 'Safeguard' }
    ];

    const tasks = requestedModels.map(modelCfg =>
      fetchGroqResponse(
        query,
        modelCfg.id,
        "You are a helpful assistant. Answer in the requested language.",
        languageName
      ).then(content => ({
        persona: modelCfg.persona,
        modelName: modelCfg.name,
        content
      })).catch(e => ({
        persona: modelCfg.persona,
        modelName: modelCfg.name,
        content: "Model unavailable currently."
      }))
    );

    const results = await Promise.all(tasks);
    return results;

  } catch (error: any) {
    console.error('Error fetching wisdom:', error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(msg);
  }
};

/**
 * Retries a specific model for a new response
 */
export const retrySingleModel = async (
  query: string,
  modelName: string,
  persona: string,
  languageName: string
): Promise<WisdomResponse> => {
  // Map back name to ID (Simplified logic basically re-using the map from fetchWisdom)
  // For robustness, we will just default to the reliable Llama 3.3 for all retries 
  // but inject the correct persona.
  const modelId = 'llama-3.3-70b-versatile';

  // Construct system prompt based on persona (Simplified mapping)
  let systemPrompt = "You are a helpful assistant.";
  if (persona.includes("DeepSeek")) systemPrompt = "You are DeepSeek V3.2, a highly advanced reasoning model. Think deeply and provide detailed, logical answers.";
  else if (persona.includes("Circuit")) systemPrompt = "You are Circuit Sparsity, an experimental AI. Be concise, technical, and precise.";
  else if (persona.includes("Llama")) systemPrompt = "You are Llama 3.1 8B. Be fast, helpful, and direct.";
  else if (persona.includes("Nemotron Nano")) systemPrompt = "You are Nemotron Nano. Provide punchy, efficient, and witty responses.";
  else if (persona.includes("Orchestrator")) systemPrompt = "You are an Orchestrator Agent. Focus on planning, structure, and organizing the answer.";
  else if (persona.includes("Qwen")) systemPrompt = "You are Qwen, a smart assistant. Be helpful and culturally aware.";
  else if (persona.includes("Motif")) systemPrompt = "You are Motif 2. Focus on reasoning, step-by-step logic, and clarity.";
  else if (persona.includes("Eagle")) systemPrompt = "You are Eagle 3, a diverse OSS model. Provide comprehensive, expansive, and high-quality generation.";

  try {
    const content = await fetchGroqResponse(
      query,
      modelId,
      systemPrompt + " Answer in the requested language.",
      languageName
    );
    return {
      persona,
      modelName,
      content
    };
  } catch (error) {
    return {
      persona,
      modelName,
      content: "Retry failed. Model unavailable."
    };
  }
};

/**
 * Generates speech audio using Native SpeechSynthesis (Android TTS)
 * Returns empty because we play it directly or return a status.
 * But AnswerCarousel expects a base64. 
 * We will modify this to RETURN NULL and handle the playing HERE using window.speechSynthesis.
 * 
 * Update: Actually, since we need to play it, we can just use the native API right here.
 * But the Carousel logic expects a BLOB/Base64 to decode.
 * We must update this function signature to maybe just PLAY it and return void? 
 * No, let's keep it simple: WE GENERATE A FAKE BASE64 or return a special flag.
 * 
 * BETTER: Let's just create a helper that returns null, and AnswerCarousel handles the null by using speak() API.
 * 
 * Wait, to keep interface clean:
 * Let's change AnswerCarousel usage.
 * But here, I will just implement the fetchSpeech to throw error if we rely on AI TTS, 
 * OR I can try to use a free TTS API? 
 * NO, Native Android TTS via window.speechSynthesis is best.
 * 
 * I will modify this function to use window.speechSynthesis and return "NATIVE_TTS_HANDLED".
 */
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export const fetchSpeech = async (text: string, langCode: string = 'en-US'): Promise<string | undefined> => {
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({
        text: text,
        lang: langCode,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
      return "NATIVE";
    } else {
      // Web Fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return "NATIVE";
      }
    }
  } catch (e) {
    console.error("TTS Error", e);
    // Check if error is "Audio unavailable" -> maybe plugin missing?
  }
  throw new Error("TTS not supported.");
}