export interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Fetches wisdom from a specific model via Groq.
 */
export const fetchGroqResponse = async (
    query: string,
    model: string,
    systemPersona: string,
    languageName: string
): Promise<string> => {
    // Note: We access the key from import.meta.env (Vite Standard)
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        console.warn("VITE_GROQ_API_KEY missing. Returning fallback.");
        return "⚠️ GROQ API KEY MISSING. Please add VITE_GROQ_API_KEY to your .env file and restart.";
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: `You are a wise assistant with the persona: ${systemPersona}. \n\nIMPORTANT: Answer STRICTLY in ${languageName} script and language. \nDo not use English unless the term is technical. \nEnsure your response is COMPLETE and does not end mid-sentence. \nKeep it concise (2-3 sentences), but meaningful.`
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                model: model,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API Error:", response.status, errorText);
            return `⚠️ GROQ ERROR (${response.status}): ${response.statusText}. Check console for details.`;
        }

        const data: GroqResponse = await response.json();
        return data.choices[0]?.message?.content || "Silence... (Empty Response)";
    } catch (error) {
        console.error("Groq Fetch Error:", error);
        return `⚠️ NETWORK ERROR: ${error instanceof Error ? error.message : "Connect failed"}`;
    }
};
