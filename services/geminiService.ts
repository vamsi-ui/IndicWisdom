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
    const ai = getAIClient();

    // 1. Define the Tasks for each model
    // Gemini handles Factual (Flash) and Creative (Flash with creative prompt)
    const geminiPrompt = `
      User Query: "${query}"
      Target Language: ${languageName}
      
      Provide 2 distinct answers in valid JSON format:
      1. Persona "Factual": Concise, direct, fact-based.
      2. Persona "Creative": Nuanced, storytelling, culturally rich.

      CRITICAL INSTRUCTIONS:
      - OUTPUT MUST BE IN ${languageName} SCRIPT.
      - Ensure all sentences are COMPLETE. Do not cut off.
      - Strictly filter out hate speech, sexual content, or violence.
      
      Schema: { "responses": [ { "persona": string, "content": string } ] }
    `;

    const geminiTask = ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: geminiPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }).then(result => {
      // Use result.text directly. 
      let text = result.text || JSON.stringify({ "responses": [] });

      // Clean potential Markdown formatting (```json ... ```)
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const json = JSON.parse(text);
        return json.responses.map((r: any) => ({
          persona: r.persona,
          modelName: "Gemini 1.5 Flash",
          content: r.content
        }));
      } catch (parseError) {
        console.warn("Gemini JSON Parse Failed:", text);
        // Fallback: If valid text exists but not JSON, return it as a generic response
        if (text.length > 20 && !text.includes("{")) {
          return [{ persona: "Sage", modelName: "Gemini 1.5 Flash", content: text }];
        }
        throw parseError; // Go to catch block
      }
    }).catch(e => {
      console.error("Gemini Task Failed", e);
      return [{
        persona: "Gemini",
        modelName: "Gemini 1.5 Flash",
        content: "I am meditating on this. Please ask again. (Model Error)"
      }];
    });

    // Groq handles Llama 3 (Philosophical), Llama 3 (Witty), and Llama 3 (Logical)
    // We launch these as individual fast requests
    const llamaPhilTask = fetchGroqResponse(
      query,
      'llama-3.3-70b-versatile',
      "You are a Philosophical Sage. Focus on ethics, dharma, and existential depth.",
      languageName
    ).then(content => ({ persona: 'Philosophical', modelName: 'Llama 3.3 70B (Groq)', content }));

    const mixtralWittyTask = fetchGroqResponse(
      query,
      'llama-3.3-70b-versatile',
      "You are a Witty Scholar. Be clever, sharp, and slightly humorous.",
      languageName
    ).then(content => ({ persona: 'Witty', modelName: 'Llama 3.3 70B (Groq)', content }));

    const llamaLogicalTask = fetchGroqResponse(
      query,
      'llama-3.1-8b-instant',
      "You are a Logical Professor. Break down the answer into structured points.",
      languageName
    ).then(content => ({ persona: 'Logical', modelName: 'Llama 3.1 8B (Groq)', content }));

    // 2. Wait for all to finish
    const [geminiResults, philResult, wittyResult, logicalResult] = await Promise.all([
      geminiTask,
      llamaPhilTask,
      mixtralWittyTask,
      llamaLogicalTask
    ]);

    // 3. Combine and Return
    const allResponses = [
      ...geminiResults,
      philResult,
      wittyResult,
      logicalResult
    ];

    return allResponses;

  } catch (error: any) {
    console.error('Error fetching wisdom:', error);
    // Propagate the specific error message (e.g. Missing API Key) to the UI
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(msg); // Remove the generic wrapper
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