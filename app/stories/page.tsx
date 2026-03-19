"use client";

import React, { useEffect, useState } from "react";
import { StoryCarousel } from "../components/StoryCarousel";
import { useMemory } from "../context/MemoryContext";
import { useRouter, useSearchParams } from "next/navigation";
import { PrimaryButton } from "../components/PrimaryButton";
import { plural } from "../utils";
import PendingAnswers from "../components/PendingAnswers";

// Search only reveals itself once the collection is large enough to need it
const SEARCH_THRESHOLD = 10;

export default function StoriesPage() {
    const { activeMemories, activePerson, lang, deleteMemory, toggleMemoryPrivacy, setEditingId, setEditingPrompt, setStoryDraft, setImageDraft, t, setIsPhotoMode, setIsAudioMode, setIsCustomMode, setIsAskMode } = useMemory();

    const router = useRouter();
    const searchParams = useSearchParams();
    const isRandom = searchParams.get('random') === 'true';

    // Reset all input modes when landing on Stories page
    useEffect(() => {
        setIsAudioMode(false);
        setIsPhotoMode(false);
        setIsCustomMode(false);
        setIsAskMode(false);
    }, []);

    // Stable items array (newest first)
    const items = React.useMemo(() => [...activeMemories].reverse(), [activeMemories]);

    // Random index for "open at random" nav
    const [initialIndex, setInitialIndex] = useState(0);
    useEffect(() => {
        if (isRandom && items.length > 0) {
            setInitialIndex(Math.floor(Math.random() * items.length));
        }
    }, [isRandom, items.length]);

    function startEditing(item: any) {
        setEditingId(item.id);
        setEditingPrompt(item.prompt);
        setStoryDraft(item.text);
        setImageDraft(item.imageUrl || "");
        setIsAudioMode(!!item.audioUrl);
        setIsPhotoMode(!!item.imageUrl && !item.text && !item.audioUrl);
        setIsCustomMode(
            !item.audioUrl && !item.imageUrl &&
            !!item.prompt &&
            item.prompt !== "New Story" && item.prompt !== "Nueva Historia" &&
            item.prompt !== "New Photo" && item.prompt !== "Nueva Foto"
        );
        router.push("/");
    }

    // Lock / milestone state
    const CHAPTER_GOAL = 5;
    const storiesCount = activeMemories.length;
    const lockedProgress = storiesCount < CHAPTER_GOAL ? { current: storiesCount, total: CHAPTER_GOAL } : undefined;

    // ── Progressive search ────────────────────────────────────────────────
    const searchEnabled = items.length > SEARCH_THRESHOLD;
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filteredItems = React.useMemo(() => {
        if (!query.trim()) return items;
        const q = query.toLowerCase();
        return items.filter(m =>
            m.text?.toLowerCase().includes(q) ||
            m.prompt?.toLowerCase().includes(q)
        );
    }, [items, query]);

    function clearSearch() {
        setQuery("");
        setSearchOpen(false);
    }

    const carouselItems = query.trim() ? filteredItems : items;
    const isSearching = query.trim().length > 0;
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#F9F8F6] dark:bg-midnight-950 safe-top safe-bottom pb-24 transition-colors duration-500 flex flex-col">
            <div className="w-full max-w-lg mx-auto font-sans flex-1 flex flex-col">
                <div className={`p-4 pt-8 flex-1 flex flex-col ${searchOpen ? "justify-start" : "justify-center"}`}>

                        {/* ── Header ── */}
                        <div className="mb-4 px-4">
                            <div className="relative flex items-start justify-center">
                                <div className="text-center">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-700 font-sans mb-2">
                                        {activePerson ? t.storiesOf : "COLLECTION"}
                                    </div>
                                    <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
                                        {activePerson ? activePerson.name : t.storiesTitle}
                                    </h1>
                                    <p className="text-stone-500 dark:text-stone-400 text-base mt-1 italic">
                                        {isSearching
                                            ? `${filteredItems.length} ${lang === "es" ? "de" : "of"} ${items.length} ${lang === "es" ? "historias" : "stories"}`
                                            : `${storiesCount} ${plural(storiesCount, lang === "es" ? "historia" : "story")}`}
                                    </p>
                                </div>

                                {/* 🔍 — absolutely positioned so it never shifts the title */}
                                {searchEnabled && (
                                    <button
                                        onClick={() => { setSearchOpen(o => !o); if (searchOpen) setQuery(""); }}
                                        className={`absolute right-0 top-0 mt-1 p-2 rounded-full transition-all duration-200 ${
                                            searchOpen
                                                ? "text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-stone-800"
                                                : "text-stone-300 dark:text-stone-700 hover:text-stone-500 dark:hover:text-stone-400"
                                        }`}
                                        aria-label={searchOpen ? "Close search" : "Search memories"}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Search input — in-flow, appears when open */}
                            {searchEnabled && searchOpen && (
                                <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div className="flex items-center gap-3 bg-white dark:bg-midnight-900 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 shadow-sm">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 dark:text-stone-600 flex-shrink-0">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        <input
                                            autoFocus
                                            value={query}
                                            onChange={e => setQuery(e.target.value)}
                                            placeholder={lang === "es" ? "Buscar recuerdos..." : "Search memories..."}
                                            className="flex-1 bg-transparent text-sm font-serif italic text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none"
                                        />
                                        {query.length > 0 && (
                                            <button onClick={clearSearch} className="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors" aria-label="Clear">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* No results */}
                                    {isSearching && filteredItems.length === 0 && (
                                        <p className="text-center text-sm text-stone-400 dark:text-stone-600 mt-6 font-serif italic animate-in fade-in duration-200">
                                            {lang === "es" ? `Sin resultados para "${query}"` : `No stories match "${query}"`}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Pending Family Answers ── */}
                        <PendingAnswers lang={lang} />

                        {/* ── Stories ── */}
                        {activeMemories.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl mx-4 bg-stone-50 dark:bg-midnight-900/50">
                                <p className="text-stone-400 dark:text-stone-600 mb-4 font-serif italic text-lg">{t.noStories}</p>
                                <PrimaryButton onClick={() => router.push("/")}>{t.writeFirstStory}</PrimaryButton>
                            </div>
                        ) : carouselItems.length > 0 ? (
                            <StoryCarousel
                                items={carouselItems}
                                initialIndex={isSearching ? 0 : initialIndex}
                                lang={lang}
                                onDelete={deleteMemory}
                                onEdit={startEditing}
                                onTogglePrivacy={toggleMemoryPrivacy}
                                lockedProgress={isSearching ? undefined : lockedProgress}
                                onUnlockClick={() => router.push("/")}
                            />
                        ) : null}
                </div>
            </div>
        </div>
    );
}
