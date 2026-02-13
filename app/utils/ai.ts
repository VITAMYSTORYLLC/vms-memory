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

export interface StoryContext {
    prompt: string;
    text: string;
}

export async function generatePersonalizedQuestions(
    personName: string,
    stories: StoryContext[],
    lang: 'en' | 'es',
    count: number = 3
): Promise<string[]> {
    if (!genAI) {
        // Mock questions for demo purposes if no API key is provided
        await new Promise(r => setTimeout(r, 2000));
        if (lang === 'es') {
            return [
                `¿Cuál era el lugar favorito de ${personName}?`,
                `Cuéntame sobre una tradición especial que compartías con ${personName}.`,
                `¿Qué consejo de ${personName} recuerdas más?`
            ];
        }
        return [
            `What was ${personName}'s favorite place?`,
            `Tell me about a special tradition you shared with ${personName}.`,
            `What advice from ${personName} do you remember most?`
        ];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build context from existing stories
    const storiesContext = stories.map((s, i) =>
        `Story ${i + 1}:\nQuestion: ${s.prompt}\nAnswer: ${s.text}`
    ).join('\n\n');

    const systemInstruction = lang === 'es'
        ? `Eres un asistente compasivo que ayuda a las personas a preservar memorias de sus seres queridos. 
Tu tarea es generar ${count} preguntas personalizadas y reflexivas basadas en las historias que ya han compartido sobre ${personName}.

REGLAS IMPORTANTES:
- Las preguntas deben hacer referencia a detalles específicos de las historias compartidas
- Deben fomentar una reflexión más profunda
- Deben sentirse naturales y conversacionales
- Deben ser culturalmente sensibles y respetuosas
- NO repitas preguntas que ya han sido respondidas
- Devuelve SOLAMENTE las preguntas, una por línea, sin numeración ni formato adicional
- SIEMPRE responde en español

Historias compartidas sobre ${personName}:
${storiesContext}

Genera ${count} preguntas personalizadas:`
        : `You are a compassionate assistant helping people preserve memories of their loved ones.
Your task is to generate ${count} personalized, thoughtful questions based on the stories they've already shared about ${personName}.

IMPORTANT RULES:
- Questions must reference specific details from the shared stories
- They should encourage deeper reflection
- They should feel natural and conversational
- They should be culturally sensitive and respectful
- DO NOT repeat questions that have already been answered
- Return ONLY the questions, one per line, without numbering or additional formatting
- ALWAYS respond in English

Stories shared about ${personName}:
${storiesContext}

Generate ${count} personalized questions:`;

    try {
        const result = await model.generateContent(systemInstruction);
        const response = await result.response;
        const text = response.text().trim();

        if (!text) throw new Error("Empty response from AI");

        // Split by newlines and filter out empty lines
        const questions = text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            // Remove numbering if AI added it (e.g., "1. ", "- ")
            .map(q => q.replace(/^[\d\-\*\.]+\s*/, ''))
            .slice(0, count); // Ensure we only return the requested count

        return questions;
    } catch (error: any) {
        console.error("Gemini Question Generation Error:", error);

        const message = error.message || "Unknown AI error";
        if (message.includes("429")) throw new Error("QUOTA_EXCEEDED");
        if (message.includes("API key not valid")) throw new Error("INVALID_API_KEY");

        throw error;
    }
}
