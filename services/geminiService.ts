import { GoogleGenAI, Type, Schema, Modality } from '@google/genai';
import { WisdomResponse } from '../types';

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates wisdom responses in the target Indic language.
 * To optimize for speed and reduce API round-trips, we ask Gemini to
 * generate all 5 persona responses in a single JSON call.
 */
export const fetchWisdom = async (
  query: string,
  languageName: string
): Promise<WisdomResponse[]> => {
  try {
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
    
    // Map the generic output to our UI friendly structure
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
 * Returns a Base64 string of raw PCM audio data.
 */
export const fetchSpeech = async (text: string): Promise<string | undefined> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a good general purpose voice
                  },
              },
            },
          });
          
          return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Could not generate audio.");
    }
}