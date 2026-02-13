import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function refineStory(originalText: string, prompt: string, lang: 'en' | 'es'): Promise<string> {
    if (!genAI) {
        // Mock refinement for demo purposes if no API key is provided
        await new Promise(r => setTimeout(r, 2000)); // Simulate network lag
        if (lang === 'es') {
            return `[REFREINADO] ${originalText} (Esta es una versión pulida de tu historia. Conecta las ideas de manera más fluida y añade un tono narrativo profesional).`;
        }
        return `[REFINED] ${originalText} (This is a polished version of your story. It connects your ideas more fluently and adds a professional narrative tone).`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemInstruction = lang === 'es'
        ? "Eres un periodista de memorias familiares fiel y profesional. Tu tarea es pulir un recuerdo crudo para que sea gramaticalmente perfecto, fluido y elegante. REGLA CRUCIAL: No inventes ni añadas NINGÚN detalle nuevo que no esté en el texto original. Limítate estrictamente a los hechos proporcionados, solo mejora la redacción. Responde SIEMPRE en español. IMPORTANTE: Devuelve SOLAMENTE el texto pulido, sin etiquetas como 'Texto pulido:' ni incluyas el texto original."
        : "You are a faithful and professional family memoir journalist. Your task is to polish a raw memory to be grammatically perfect, fluent, and elegant. CRUCIAL RULE: Do not invent or add ANY new details that are not in the original text. Stick strictly to the facts provided, only improve the prose. ALWAYS respond in English. IMPORTANT: Return ONLY the polished text, do not use labels like 'Polished Text:' and do not include the original text.";

    const fullPrompt = `${systemInstruction}\n\nOriginal Text to Polish:\n"${originalText}"\n\n(Context/Prompt: ${prompt})`;

    try {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text().trim();
        if (!text) throw new Error("Empty response from AI");
        return text;
    } catch (error: any) {
        console.error("Gemini Refine Error:", error);

        // Extract a more useful error message if possible
        const message = error.message || "Unknown AI error";
        if (message.includes("429")) throw new Error("QUOTA_EXCEEDED");
        if (message.includes("API key not valid")) throw new Error("INVALID_API_KEY");

        throw error;
    }
}
