"use client";

import React, { useEffect, useState } from "react";
import { StoryCarousel } from "../components/StoryCarousel";
import { useMemory } from "../context/MemoryContext";
import { useRouter, useSearchParams } from "next/navigation";
import { PrimaryButton } from "../components/PrimaryButton";
import { plural } from "../utils";

export default function StoriesPage() {
    const { activeMemories, activePerson, lang, deleteMemory, setEditingId, setEditingPrompt, setStoryDraft, setImageDraft, t, setIsPhotoMode, setIsAudioMode, setIsCustomMode, generateAIQuestions, setIsAIMode, setAICurrentQuestionIndex } = useMemory();

    const router = useRouter();
    const searchParams = useSearchParams();
    const isRandom = searchParams.get('random') === 'true';
    const [isGenerating, setIsGenerating] = useState(false);

    // Stable items array
    const items = React.useMemo(() => [...activeMemories].reverse(), [activeMemories]);

    // Stable random index
    const [initialIndex, setInitialIndex] = useState(0);

    // Set random index once when items are available
    useEffect(() => {
        // Only if random requested and we haven't set a random index yet (assuming default is 0)
        // Actually, we want to run this once.
        if (isRandom && items.length > 0) {
            // Use a ref to prevent re-randomizing? 
            // Or just verify if we are at 0 (which is default). 
            // But if specific memory is 0, we might re-randomize.
            // Better: Just set it.
            const rnd = Math.floor(Math.random() * items.length);
            setInitialIndex(rnd);
        }
    }, [isRandom, items.length]); // Dependencies might cause re-run if items load later, which is good.
    // If items length changes, re-randomizing is probably okay or intended.

    function startEditing(item: any) {
        setEditingId(item.id);
        setEditingPrompt(item.prompt);
        setStoryDraft(item.text);
        setImageDraft(item.imageUrl || "");
        setIsPhotoMode(false);
        setIsAudioMode(false);
        setIsCustomMode(false);
        router.push("/"); // Go to home/write
    }

    // Check lock status for Photo/Audio/Custom modes
    const CHAPTER_GOAL = 5;
    const storiesCount = activeMemories.length;
    const isLocked = storiesCount < CHAPTER_GOAL;
    const lockedProgress = isLocked ? { current: storiesCount, total: CHAPTER_GOAL } : undefined;

    // Calculate AI Questions milestone progress
    const has5Stories = storiesCount >= 5;
    const hasPhotoStory = activeMemories.some(m => m.imageUrl);
    const hasAudioStory = activeMemories.some(m => m.audioUrl || m.isAudioStory);
    const hasProfilePhoto = !!activePerson?.photoUrl;

    const aiMilestones = {
        stories: has5Stories,
        photoStory: hasPhotoStory,
        audioStory: hasAudioStory,
        profilePhoto: hasProfilePhoto
    };

    const aiMilestonesCompleted = Object.values(aiMilestones).filter(Boolean).length;
    const aiMilestonesTotal = 4;
    const aiQuestionsUnlocked = aiMilestonesCompleted === aiMilestonesTotal;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-midnight-950 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg font-sans h-full sm:h-auto">
                <div className="p-4 pt-8 flex-1 flex flex-col h-screen sm:h-auto">

                    <div className="flex-1 flex flex-col justify-center">
                        {/* Header */}
                        <div className="mb-8 px-4 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-700 font-sans mb-2">
                                {activePerson ? t.storiesOf : "COLLECTION"}
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">{activePerson ? activePerson.name : t.storiesTitle}</h1>
                            <p className="text-stone-500 dark:text-stone-400 text-base mt-1 italic">{activeMemories.length} {plural(activeMemories.length, lang === "es" ? "historia" : "story")}</p>
                        </div>

                        {activeMemories.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl mx-4 bg-stone-50 dark:bg-midnight-900/50">
                                <p className="text-stone-400 dark:text-stone-600 mb-4 font-serif italic text-lg">{t.noStories}</p>
                                <PrimaryButton onClick={() => router.push("/")}>{t.writeFirstStory}</PrimaryButton>
                            </div>
                        ) : (
                            <StoryCarousel
                                items={items}
                                initialIndex={initialIndex}
                                lang={lang}
                                onDelete={deleteMemory}
                                onEdit={startEditing}
                                lockedProgress={lockedProgress}
                                onUnlockClick={() => router.push("/")}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
