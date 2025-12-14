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

      SAFETY INSTRUCTION: Ensure all content is family-friendly, safe for all ages. strictly filter out hate speech, sexual content, or violence.
      
      Schema: { "responses": [ { "persona": string, "content": string } ] }
    `;

    const geminiTask = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: geminiPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }).then(result => {
      const json = JSON.parse(result.text || '{ "responses": [] }');
      return json.responses.map((r: any) => ({
        persona: r.persona,
        modelName: "Gemini 2.5 Flash",
        content: r.content
      }));
    }).catch(e => {
      console.error("Gemini Task Failed", e);
      return [];
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
 * Generates speech audio from text using Gemini TTS.
 */
export const fetchSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        // Use string literal 'AUDIO' to avoid Enum import issues
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      console.warn("TTS API response structure:", JSON.stringify(response, null, 2));
      throw new Error("API returned success but no inline audio data found.");
    }

    return audioData;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Could not generate audio.");
  }
}