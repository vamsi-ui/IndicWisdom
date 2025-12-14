import { GoogleGenAI, Type, Schema } from '@google/genai';
import { WisdomResponse } from '../types';

// Helper to get a fresh client instance with the latest key
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
export const fetchWisdom = async (
  query: string,
  languageName: string
): Promise<WisdomResponse[]> => {
  try {
    const ai = getAIClient();
    const prompt = `
      User Query: "${query}"
      Target Language: ${languageName}
      
      Task:
      1. Analyze the user's query.
      2. Provide 5 distinct answers in the Target Language (${languageName}).
      
      Personas:
      1. "Factual": Concise, direct, fact-based answer (Act as Gemini Flash).
      2. "Logical": Detailed, structured, educational explanation (Act as GPT-4o mini).
      3. "Creative": Nuanced, storytelling, culturally rich answer (Act as Claude 3 Haiku).
      4. "Philosophical": Deep, existential, rooted in ethics/dharma (Act as Llama 3).
      5. "Witty": Clever, sharp, maybe a bit humorous or paradoxical (Act as Mistral Large).
      
      Return ONLY valid JSON.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        responses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              persona: { type: Type.STRING, enum: ['Factual', 'Logical', 'Creative', 'Philosophical', 'Witty'] },
              modelName: { type: Type.STRING },
              content: { type: Type.STRING, description: `The answer in ${languageName}` },
            },
            required: ['persona', 'modelName', 'content'],
          },
        },
      },
      required: ['responses'],
    };

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = result.text || '{ "responses": [] }';
    const parsed = JSON.parse(jsonText);
    
    return parsed.responses.map((r: any) => {
        let displayModel = "Gemini Flash";
        if (r.persona === "Logical") displayModel = "GPT-4o Mini (Simulated)";
        if (r.persona === "Creative") displayModel = "Claude 3 Haiku (Simulated)";
        if (r.persona === "Philosophical") displayModel = "Llama 3 70B (Simulated)";
        if (r.persona === "Witty") displayModel = "Mistral Large (Simulated)";
        
        return {
            persona: r.persona,
            modelName: displayModel,
            content: r.content
        };
    });

  } catch (error) {
    console.error('Error fetching wisdom:', error);
    throw new Error('Failed to generate wisdom. Please try again.');
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