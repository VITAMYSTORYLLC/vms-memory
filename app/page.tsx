"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Step } from "./types";
import {
  currentWeekNumber,
  wrapIndex,
  loadUsedQuestionIndexes,
  saveUsedQuestionIndexes,
  nextUnusedIndex,
  hasBadge,
  addBadge,
  compressImage,
  normalize,
} from "./utils";
import { renderWithBoldName } from "./utils/text";
import { QUESTION_EXAMPLES } from "./constants";
import { useSwipe } from "./hooks/useSwipe";
import { PrimaryButton } from "./components/PrimaryButton";
import { SecondaryButton } from "./components/SecondaryButton";
import { ArrowButton } from "./components/ArrowButton";


import { useDictation } from "./hooks/useDictation";
import { useMemory } from "./context/MemoryContext";
import { useRouter } from "next/navigation";

export default function Page() {
  const {
    people,
    activePerson,
    activePersonId,
    lang,
    isHydrated,
    t,
    storyDraft, setStoryDraft,
    nameDraft,
    imageDraft, setImageDraft,
    inspiration, setInspiration,
    editingId, setEditingId,
    editingPrompt, setEditingPrompt,
    saveStory,
    startNewPerson,
    addNotification,
  } = useMemory();


  const router = useRouter();

  const QUESTIONS = useMemo(() => [t.q1, t.q2, t.q3, t.q4, t.q5], [t]);

  // Local UI state for the "Flow"
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  // "HOME" in local step meant "Carousel". We don't have that here anymore.
  // We utilize "WRITE" as the default state for existing users.
  const [step, setStep] = useState<Step>("WELCOME");

  const [usedVersion, setUsedVersion] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false); // Maybe not needed here anymore

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported, toggleListening } = useDictation(lang, (text) => {
    setStoryDraft((prev) => prev + text);
  });

  // --- Effects ---

  // Set initial step
  // Set initial step and redirect logic
  useEffect(() => {
    if (isHydrated) {
      if (!activePerson && !normalize(nameDraft)) {
        router.replace("/family");
      } else {
        if (step === "WELCOME") setStep("WRITE");
      }
    }
  }, [isHydrated, activePerson, nameDraft, router, step]);

  // Question rotation
  useEffect(() => {
    const week = currentWeekNumber();
    // We could store detailed state in context but simple rotation is fine here
    setQuestionIndex(week % QUESTIONS.length);
  }, [QUESTIONS.length]);

  const displayName = activePerson?.name || normalize(nameDraft);
  const usedSet = useMemo(() => new Set<number>(loadUsedQuestionIndexes(activePersonId || "")), [activePersonId, usedVersion]);
  const allStarterUsed = usedSet.size >= QUESTIONS.length && QUESTIONS.length > 0;
  const currentQuestion = useMemo(() => QUESTIONS[wrapIndex(questionIndex, QUESTIONS.length)] || QUESTIONS[0], [questionIndex, QUESTIONS]);

  const displayQuestion = useMemo(() => {
    if (editingId && editingPrompt) return { type: "plain" as const, text: editingPrompt };
    if (allStarterUsed) return { type: "free" as const, text: t.qFree };
    const q = currentQuestion; const name = displayName;
    if (q.includes("known for") || q.includes("conocidos")) return { type: "knownFor" as const, text: t.qKnownFor(name) };
    if (q.includes("describe") || q.includes("describirías")) return { type: "describe" as const, text: t.qDescribe(name) };
    if (q.includes("first memory") || q.includes("primer recuerdo")) return { type: "firstMemory" as const, text: t.qFirstMemory(name) };
    if (q.includes("everyone to know") || q.includes("todos sepan")) return { type: "everyoneKnow" as const, text: t.qEveryoneKnow(name) };
    if (q.includes("mattered most") || q.includes("más les importaba")) return { type: "matteredMost" as const, text: t.qMatteredMost(name) };
    return { type: "plain" as const, text: q };
  }, [allStarterUsed, currentQuestion, displayName, t, editingId, editingPrompt]);

  const promptToSave = useMemo(() => (editingId && editingPrompt) ? editingPrompt : allStarterUsed ? "" : displayQuestion.text, [allStarterUsed, displayQuestion.text, editingId, editingPrompt]);
  const usedCount = usedSet.size; const starterTotal = QUESTIONS.length;
  const starterProgressIndex = useMemo(() => Math.min(starterTotal, Math.max(1, usedCount + 1)), [starterTotal, usedCount]);

  function goPrevQuestion() { if (allStarterUsed) return; setQuestionIndex((i) => nextUnusedIndex(i, -1, QUESTIONS.length, usedSet)); setInspiration(null); }
  function goNextQuestion() { if (allStarterUsed) return; setQuestionIndex((i) => nextUnusedIndex(i, 1, QUESTIONS.length, usedSet)); setInspiration(null); }
  const questionSwipeHandlers = useSwipe(goNextQuestion, goPrevQuestion);

  function markCurrentQuestionUsed(personId: string) { if (!personId || allStarterUsed) return; const idx = wrapIndex(questionIndex, QUESTIONS.length); saveUsedQuestionIndexes(personId, [...Array.from(usedSet), idx]); setUsedVersion((v) => v + 1); }
  function maybeAwardStoryKeeper(personId: string) { if (!personId) return false; const used = loadUsedQuestionIndexes(personId); if (used.length < QUESTIONS.length || hasBadge(personId, "story_keeper")) return false; addBadge(personId, "story_keeper"); setBadgeVersion((v) => v + 1); return true; }
  function advanceToNextUnused(personId: string) { if (!personId) return; const usedNext = new Set<number>(loadUsedQuestionIndexes(personId)); if (usedNext.size >= QUESTIONS.length) return; setQuestionIndex(nextUnusedIndex(questionIndex, 1, QUESTIONS.length, usedNext)); }

  async function handleSave() {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800)); // UX delay

    // If writing for new person
    if (!activePerson && step !== "WRITE") {
      // handle save called from elsewhere? Unlikely in this flow.
    }

    const savedPersonId = await saveStory(promptToSave);
    if (!savedPersonId) {
      setIsSaving(false);
      return;
    }

    // Post-save logic (Question advancement, badges)
    // We use savedPersonId because activePerson might be null (if this was a new person)
    // or stale in this closure.
    const willCompleteStarter = !allStarterUsed && usedSet.size === QUESTIONS.length - 1;
    markCurrentQuestionUsed(savedPersonId);
    advanceToNextUnused(savedPersonId);

    if (willCompleteStarter) {
      const awarded = maybeAwardStoryKeeper(savedPersonId);
      if (awarded) {
        addNotification(
          "Story Keeper Badge Unlocked! 🏆",
          `You've officially become the Story Keeper for ${activePerson ? activePerson.name : "your loved one"}.`,
          "feature"
        );
      }
      setStep("BADGE");
    } else {
      setStep("SAVED");
    }

    setIsSaving(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setImageDraft(base64);
    } catch (err) {
      console.error(err);
    }
  }

  const canSave = (normalize(storyDraft).length > 0 || imageDraft.length > 0) && normalize(displayName).length > 0;

  if (!isHydrated) return <div className="min-h-screen bg-[#F9F8F6]"></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] text-stone-900 selection:bg-stone-200 safe-top safe-bottom pb-24">
      <div className="w-full max-w-lg sm:px-4 font-sans h-full sm:h-auto">
        <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex-1 flex flex-col overflow-hidden">

          {/* WELCOME FLOW */}


          {/* MAIN WRITE FLOW */}
          {step === "WRITE" && (
            <div {...questionSwipeHandlers} className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500 touch-pan-y overflow-hidden pt-4 sm:pt-0">
              <div className="text-center space-y-3 mb-6 sm:mb-8 flex-shrink-0">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 font-sans">
                  {editingId ? "EDITING" : allStarterUsed ? t.freeChapter : `Chapter ${starterProgressIndex} of ${starterTotal}`}
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif leading-tight sm:leading-relaxed text-stone-900 px-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {renderWithBoldName(displayQuestion.text)}
                </h2>
                <div className="min-h-[28px] flex items-center justify-center pt-3">
                  {!allStarterUsed && !editingId && (
                    <button
                      onClick={() => {
                        const idx = wrapIndex(questionIndex, QUESTIONS.length);
                        // @ts-ignore
                        const example = QUESTION_EXAMPLES[lang][idx];
                        setInspiration(example);
                      }}
                      className={`text-xs font-bold uppercase tracking-[0.1em] transition-colors flex items-center gap-2 py-2.5 px-6 bg-stone-50 rounded-full border border-stone-100 ${inspiration ? "text-stone-600 bg-stone-100" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"}`}
                    >
                      <span>✨ {t.inspireMe}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="h-96 relative flex flex-col min-h-0 mb-8 bg-stone-50/50 rounded-2xl border border-stone-200 shadow-inner overflow-hidden">
                {imageDraft && (
                  <div className="h-20 sm:h-48 w-full relative flex-shrink-0">
                    <video src="" className="hidden" />{/* Dummy video for types?? No */}
                    <img src={imageDraft} className="w-full h-full object-cover opacity-60 absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-50/50"></div>
                    <button onClick={() => setImageDraft("")} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 sm:p-1.5 hover:bg-black/70 z-30 backdrop-blur-sm"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                  </div>
                )}

                <textarea
                  value={storyDraft}
                  onChange={(e) => setStoryDraft(e.target.value)}
                  placeholder={inspiration || t.writePlaceholder}
                  className="w-full h-full resize-none bg-transparent p-5 text-lg sm:text-2xl font-serif leading-relaxed text-stone-800 placeholder:font-serif placeholder:italic placeholder:text-stone-300 focus:outline-none z-10"
                />

                {isSupported && (
                  <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-full shadow-lg border transition-all ${imageDraft ? "bg-stone-800 text-white border-stone-900" : "bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:scale-105"}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></button>
                    <button onClick={toggleListening} className={`p-3 rounded-full shadow-lg border transition-all ${isListening ? "bg-red-50 text-red-600 border-red-200 animate-pulse scale-110" : "bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:scale-105"}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg></button>
                  </div>
                )}

                {!editingId && (
                  <>
                    <div className="absolute left-0 sm:-left-5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto transition-opacity">
                      <ArrowButton direction="left" onClick={goPrevQuestion} disabled={allStarterUsed} />
                    </div>
                    <div className="absolute right-0 sm:-right-5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto transition-opacity">
                      <ArrowButton direction="right" onClick={goNextQuestion} disabled={allStarterUsed} />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6 flex-shrink-0 pb-8 sm:pb-4">
                <PrimaryButton disabled={!canSave || isSaving} onClick={handleSave}>
                  {isSaving ? "Saving..." : editingId ? t.updateStory : t.saveStory}
                </PrimaryButton>
                {editingId && <div className="text-center"><button onClick={() => { setEditingId(null); setEditingPrompt(""); setStoryDraft(""); setImageDraft(""); }} className="text-sm font-bold tracking-widest text-stone-400 hover:text-stone-600 font-sans uppercase">Cancel editing</button></div>}
              </div>
            </div>
          )}

          {/* SAVED SUCCESS */}
          {step === "SAVED" && (
            <div className="flex-1 flex flex-col justify-center space-y-10 animate-in zoom-in-95 duration-500 pb-8">
              <div className="text-center pt-8">
                <span className="text-stone-300 text-xs uppercase tracking-widest">Version Alpha 1.0</span>
              </div>
              <div className="text-center space-y-6">
                <div className="text-7xl animate-bounce mb-2">✨</div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{t.storySavedTitle}</h2>
                <p className="text-stone-500 px-6 font-sans text-sm leading-relaxed">{t.storySavedBody}</p>
              </div>
              <div className="space-y-4 pt-4 px-2">
                <PrimaryButton onClick={() => setStep("WRITE")}>{t.addAnother}</PrimaryButton>
                <SecondaryButton onClick={() => router.push("/stories")}>{t.viewStories}</SecondaryButton>
              </div>
            </div>
          )}

          {step === "BADGE" && (
            <div className="flex-1 flex flex-col justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="text-8xl animate-bounce">📖</div>
              <h2 className="text-3xl font-bold">{t.badgeModalTitle}</h2>
              <p className="text-stone-500 font-sans mt-4 px-6">{t.storyKeeperBody(displayName)}</p>
              <div className="space-y-3">
                <PrimaryButton onClick={() => setStep("WRITE")}>{t.addAnother}</PrimaryButton>
                <SecondaryButton onClick={() => router.push("/stories")}>{t.viewStories}</SecondaryButton>
              </div>
            </div>
          )}

          {/* Auth Modal if active */}


        </div>
      </div>
    </div>
  );
}