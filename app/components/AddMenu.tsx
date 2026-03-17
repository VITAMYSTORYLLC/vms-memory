"use client";

import React, { useState } from "react";
import { useMemory } from "../context/MemoryContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit3, FiCamera, FiMic, FiZap, FiPlus, FiMessageCircle } from "react-icons/fi";
import { TEXT } from "../constants";
import { useSwipe } from "../hooks/useSwipe";
import { Haptics } from "../utils/haptics";

interface AddMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddMenu({ isOpen, onClose }: AddMenuProps) {
    const {
        setIsCustomMode,
        setIsPhotoMode,
        setIsAudioMode,
        setIsAIMode,
        setIsAskMode,
        setAICurrentQuestionIndex,
        generateAIQuestions,
        activePerson,
        activeMemories,
        lang
    } = useMemory();
    const router = useRouter();
    const t = TEXT[lang];
    const [index, setIndex] = useState(0);

    // Milestones Logic
    const storiesCount = activeMemories.length;
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

    const isLocked = activeMemories.length < 5;

    const cards = [
        { id: "story", icon: <FiPlus size={32} />, title: t.newStoryTitle, subtitle: t.newStorySubtitle, mode: "story" as const, disabled: false },
        { id: "photo", icon: <FiCamera size={32} />, title: t.newPhoto, subtitle: isLocked ? `${t.lockedSubtitle || "Unlock at 5 stories"}` : t.newPhotoSubtitle, mode: "photo" as const, disabled: isLocked },
        { id: "audio", icon: <FiMic size={32} />, title: t.newAudio, subtitle: isLocked ? `${t.lockedSubtitle || "Unlock at 5 stories"}` : t.newAudioSubtitle, mode: "audio" as const, disabled: isLocked },
        { id: "ai", icon: <FiZap size={32} />, title: t.aiQuestions, subtitle: !aiQuestionsUnlocked ? "Complete all milestones to unlock" : t.aiQuestionsSubtitle, mode: "ai" as const, disabled: !aiQuestionsUnlocked },
    ];

    const handleOption = async (mode: "story" | "photo" | "audio" | "ai") => {
        const card = cards.find(c => c.mode === mode);
        if (card?.disabled) return;

        // Reset all modes first
        setIsCustomMode(false);
        setIsPhotoMode(false);
        setIsAudioMode(false);
        setIsAIMode(false);
        setIsAskMode(false);

        switch (mode) {
            case "story":
                setIsCustomMode(true);
                break;
            case "photo":
                setIsPhotoMode(true);
                break;
            case "audio":
                setIsAudioMode(true);
                break;
            case "ai":
                if (activePerson && (!activePerson.aiQuestions || activePerson.aiQuestions.length === 0)) {
                    await generateAIQuestions(activePerson.id);
                }
                setIsAIMode(true);
                setAICurrentQuestionIndex(0);
                break;
        }

        onClose();
        router.push("/");
    };

    const prev = () => {
        if (index > 0) { Haptics.light(); setIndex(index - 1); }
    };

    const next = () => {
        if (index < cards.length - 1) { Haptics.light(); setIndex(index + 1); }
    };

    const swipeHandlers = useSwipe(next, prev);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Menu Content - Full Screen Carousel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-32"
                    >
                        <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg h-[580px] overflow-hidden">
                            {/* Carousel */}
                            <div
                                {...swipeHandlers}
                                className="flex transition-transform duration-500 ease-out h-full select-none"
                                style={{
                                    transform: `translateX(calc(-${index * 90}% + 5%))`,
                                    width: '100%'
                                }}
                            >
                                {cards.map((card, i) => {
                                    const isActive = i === index;
                                    return (
                                        <div
                                            key={card.id}
                                            onClick={() => {
                                                if (!isActive) {
                                                    setIndex(i);
                                                } else {
                                                    handleOption(card.mode);
                                                }
                                            }}
                                            className={`flex-shrink-0 w-[90%] px-2 h-full transition-all duration-500 ease-out cursor-pointer ${isActive ? "scale-100 opacity-100 cursor-default" : "scale-[0.92] opacity-60 hover:opacity-80"}`}
                                            style={{ flex: "0 0 90%" }}
                                        >
                                            <div className={`bg-white dark:bg-midnight-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-[2rem] h-full flex flex-col items-center justify-center p-8 space-y-6 text-center transition-colors animate-in fade-in duration-500 group ${card.disabled ? 'grayscale opacity-60 cursor-not-allowed' : ''}`}>
                                                {/* Icon Circle */}
                                                <div className={`w-20 h-20 rounded-full bg-stone-50 dark:bg-midnight-950 border-2 border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-600 transition-transform duration-500 ${!card.disabled && 'group-hover:scale-110'} 
                                                    ${!card.disabled && card.id === 'photo' ? 'group-hover:text-blue-400 group-hover:border-blue-200' :
                                                        !card.disabled && card.id === 'audio' ? 'group-hover:text-red-400 group-hover:border-red-200' :
                                                            !card.disabled && card.id === 'ai' ? 'group-hover:text-purple-400 group-hover:border-purple-200' : ''
                                                    }`}>
                                                    {card.icon}
                                                </div>

                                                {/* Title & Subtitle */}
                                                <div className="space-y-1 w-full">
                                                    <h4 className="text-stone-900 dark:text-stone-100 font-serif font-bold text-xl">
                                                        {card.title} {card.disabled && '🔒'}
                                                    </h4>
                                                    <div className="text-stone-400 dark:text-stone-600 font-sans text-sm italic">
                                                        {card.subtitle}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Navigation Arrows */}
                            {index > 0 && (
                                <button
                                    onClick={prev}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors z-10"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                </button>
                            )}
                            {index < cards.length - 1 && (
                                <button
                                    onClick={next}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors z-10"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            )}

                            {/* Pagination Dots */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {cards.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setIndex(i)}
                                        className={`h-2 rounded-full transition-all ${i === index
                                            ? "w-8 bg-stone-800 dark:bg-stone-100"
                                            : "w-2 bg-stone-200 dark:bg-stone-700"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 w-10 h-10 bg-white dark:bg-stone-800 rounded-full shadow-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
