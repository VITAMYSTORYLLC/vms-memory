"use client";

import React from "react";
import { StoryCarousel } from "../components/StoryCarousel";
import { useMemory } from "../context/MemoryContext";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "../components/PrimaryButton";
import { plural } from "../utils";

export default function StoriesPage() {
    const { activeMemories, activePerson, lang, deleteMemory, setEditingId, setEditingPrompt, setStoryDraft, setImageDraft, t } = useMemory();
    const router = useRouter();

    function startEditing(item: any) {
        setEditingId(item.id);
        setEditingPrompt(item.prompt);
        setStoryDraft(item.text);
        setImageDraft(item.imageUrl || "");
        router.push("/"); // Go to home/write
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] safe-top safe-bottom pb-24">
            <div className="w-full max-w-lg font-sans h-full sm:h-auto">
                <div className="p-4 pt-8 flex-1 flex flex-col h-screen sm:h-auto">

                    <div className="flex-1 flex flex-col justify-center">
                        {/* Header */}
                        <div className="mb-8 px-4 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 font-sans mb-2">
                                {activePerson ? t.storiesOf : "COLLECTION"}
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900">{activePerson ? activePerson.name : t.storiesTitle}</h1>
                            <p className="text-stone-500 text-base mt-1 italic">{activeMemories.length} {plural(activeMemories.length, lang === "es" ? "historia" : "story")}</p>
                        </div>

                        {activeMemories.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-stone-200 rounded-2xl mx-4 bg-stone-50">
                                <p className="text-stone-400 mb-4 font-serif italic text-lg">{t.noStories}</p>
                                <PrimaryButton onClick={() => router.push("/")}>{t.writeFirstStory}</PrimaryButton>
                            </div>
                        ) : (
                            <StoryCarousel
                                items={[...activeMemories].reverse()}
                                lang={lang}
                                onDelete={deleteMemory}
                                onEdit={startEditing}
                                onAdd={() => router.push("/")}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
