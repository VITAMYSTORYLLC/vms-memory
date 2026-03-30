import { Lang } from "@/types";
import { TEXT } from "@/constants";

export function getQuestionText(id: string, name: string, t: typeof TEXT["en"]): string {
    if (!id) return "";

    // Check for standard questions
    if (id.startsWith("q_")) {
        const index = parseInt(id.split("_")[1]);
        switch (index) {
            case 0: return t.qFirstMemory(name);
            case 1: return t.qEveryoneKnow(name);
            case 2: return t.qKnownFor(name);
            case 3: return t.qDescribe(name);
            case 4: return t.qMatteredMost(name);
            default: return ""; // Fallback or unknown index
        }
    }

    // Check for "free" question
    if (id === "free") {
        return t.qFree;
    }

    // If it's a specific edit or unknown ID, we might need to fallback to the stored prompt
    // But this function only returns the *dynamic* text if possible.
    // The component should handle the fallback to item.prompt.
    return "";
}
