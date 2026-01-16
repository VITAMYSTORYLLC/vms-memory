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
import { Haptics } from "./utils/haptics";
import { RefineModal } from "./components/RefineModal";

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
    setDraftKey,
    startNewPerson,
    addNotification,
  } = useMemory();

  const router = useRouter();
  const QUESTIONS = useMemo(() => [t.q1, t.q2, t.q3, t.q4, t.q5], [t]);

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [step, setStep] = useState<Step>("WELCOME");
  const [usedVersion, setUsedVersion] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastActivity = useRef(Date.now());

  // Update activity timestamp on interaction
  useEffect(() => {
    lastActivity.current = Date.now();
    setShowNudge(false);
  }, [storyDraft, questionIndex, step, editingId]);

  // Inactivity Nudge Loop
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (step !== "WRITE" || editingId || normalize(storyDraft).length > 0) {
        setShowNudge(false);
        return;
      }

      const idleTime = Date.now() - lastActivity.current;
      if (idleTime > 8000) {
        // Cycle every 8 seconds (4s visible, 4s hidden)
        // We shift by 8000 so it starts visible right at 8000
        const cycle = Math.floor((idleTime - 8000) / 4000);
        setShowNudge(cycle % 2 === 0);
      } else {
        setShowNudge(false);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [step, editingId, storyDraft]);

  const { isListening, isSupported, toggleListening } = useDictation(lang, (text) => {
    setStoryDraft((prev) => prev + text);
  });

  const displayName = activePerson?.name || normalize(nameDraft);
  const usedSet = useMemo(() => new Set<number>(loadUsedQuestionIndexes(activePersonId || "")), [activePersonId, usedVersion]);
  const allStarterUsed = usedSet.size >= QUESTIONS.length && QUESTIONS.length > 0;

  useEffect(() => {
    if (isHydrated) {
      if (!activePerson && !normalize(nameDraft)) {
        router.replace("/family");
      } else {
        if (step === "WELCOME") setStep("WRITE");
      }
    }
  }, [isHydrated, activePerson, nameDraft, router, step]);

  useEffect(() => {
    const week = currentWeekNumber();
    setQuestionIndex(week % QUESTIONS.length);
  }, [QUESTIONS.length]);

  useEffect(() => {
    let key = "free";
    if (editingId) {
      key = `edit_${editingId}`;
    } else if (!allStarterUsed) {
      key = `q_${wrapIndex(questionIndex, QUESTIONS.length)}`;
    }
    setDraftKey(key);
  }, [questionIndex, allStarterUsed, editingId, setDraftKey, QUESTIONS.length]);

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
    await new Promise(r => setTimeout(r, 800));
    const savedPersonId = await saveStory(promptToSave);
    if (!savedPersonId) {
      setIsSaving(false);
      return;
    }
    Haptics.success();
    const willCompleteStarter = !allStarterUsed && usedSet.size === QUESTIONS.length - 1;
    markCurrentQuestionUsed(savedPersonId);
    advanceToNextUnused(savedPersonId);
    if (willCompleteStarter) {
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
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-midnight-950 text-stone-900 dark:text-stone-100 selection:bg-stone-200 dark:selection:bg-stone-800 safe-top safe-bottom pb-24 transition-colors duration-500">
      <div className="w-full max-w-lg sm:px-4 font-sans h-full sm:h-auto">
        <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex-1 flex flex-col overflow-hidden">

          {/* MAIN WRITE FLOW */}
          {step === "WRITE" && (
            <div {...questionSwipeHandlers} className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500 touch-pan-y overflow-hidden pt-4 sm:pt-0">
              <div className="text-center space-y-3 mb-6 sm:mb-8 flex-shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-700 font-sans">
                  {editingId ? (lang === "es" ? "EDITANDO" : "EDITING") : allStarterUsed ? t.freeChapter : `${t.chapter} ${starterProgressIndex} ${t.of} ${starterTotal}`}
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif leading-tight sm:leading-relaxed text-stone-900 dark:text-stone-100 px-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {renderWithBoldName(displayQuestion.text)}
                </h2>
                <div className="min-h-[44px] flex items-center justify-center pt-3 relative">
                  {normalize(storyDraft).length > 20 ? (
                    <button
                      onClick={() => setShowRefineModal(true)}
                      className="absolute w-[180px] flex justify-center text-xs font-bold uppercase tracking-[0.15em] transition-all items-center gap-2 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full shadow-lg hover:scale-105 active:scale-95 animate-in fade-in zoom-in duration-300"
                    >
                      <span className="flex items-center gap-2">
                        <span>✨</span>
                        {t.refineStory}
                      </span>
                    </button>
                  ) : (
                    !allStarterUsed && !editingId && (
                      <button
                        onClick={() => {
                          const idx = wrapIndex(questionIndex, QUESTIONS.length);
                          // @ts-ignore
                          const example = QUESTION_EXAMPLES[lang][idx];
                          setInspiration(example);
                        }}
                        className={`absolute w-[180px] flex justify-center text-xs font-bold uppercase tracking-[0.15em] transition-all items-center gap-2 py-2.5 bg-white/50 dark:bg-midnight-900/50 rounded-full border border-stone-100 dark:border-stone-800 animate-in fade-in duration-300 ${inspiration ? "text-stone-900 dark:text-stone-100 bg-white dark:bg-midnight-900 shadow-sm border-white dark:border-stone-700" : "text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 hover:bg-white dark:hover:bg-stone-900"}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-stone-300 dark:text-stone-700">💡</span>
                          {t.inspireMe}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="h-96 relative flex flex-col min-h-0 mb-8 bg-white dark:bg-midnight-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden transition-colors">
                {imageDraft && (
                  <div className="h-20 sm:h-48 w-full relative flex-shrink-0">
                    <img src={imageDraft} className="w-full h-full object-cover opacity-60 absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-midnight-900"></div>
                    <button onClick={() => setImageDraft("")} className="absolute top-4 right-4 bg-stone-900/10 dark:bg-white/10 text-stone-400 dark:text-stone-500 rounded-full p-2 hover:bg-stone-900/20 dark:hover:bg-white/20 z-30 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                )}

                <textarea
                  value={storyDraft}
                  onChange={(e) => setStoryDraft(e.target.value)}
                  placeholder={inspiration ? `${t.inspirationPrefix} "${inspiration}"` : t.writePlaceholder}
                  className="w-full h-full resize-none bg-transparent p-6 text-2xl sm:text-3xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 placeholder:font-serif placeholder:italic placeholder:text-stone-200 dark:placeholder:text-stone-600 focus:outline-none z-10"
                />

                <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-full shadow-lg border transition-all ${imageDraft ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100" : "bg-white dark:bg-midnight-800 text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-700 hover:text-stone-600 dark:hover:text-stone-300 hover:scale-105"}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  </button>
                  {isSupported && (
                    <button onClick={toggleListening} className={`p-3 rounded-full shadow-lg border transition-all ${isListening ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 animate-pulse scale-110" : "bg-white dark:bg-midnight-800 text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-700 hover:text-stone-600 dark:hover:text-stone-300 hover:scale-105"}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>
                    </button>
                  )}
                </div>

                {!editingId && (
                  <>
                    <div className="absolute left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto transition-opacity">
                      <ArrowButton direction="left" onClick={goPrevQuestion} disabled={allStarterUsed} />
                    </div>
                    <div className="absolute right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto transition-opacity flex items-center">
                      {showNudge && (
                        <div className="mr-3 animate-in fade-in slide-in-from-right-4 duration-700 hidden sm:block">
                          <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 whitespace-nowrap bg-white/80 dark:bg-midnight-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-stone-100 dark:border-stone-800">
                            {t.nudgeTryAnother}
                          </span>
                        </div>
                      )}
                      <ArrowButton direction="right" onClick={goNextQuestion} disabled={allStarterUsed} shouldPulse={showNudge} />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6 flex-shrink-0 pb-8 sm:pb-4">
                <PrimaryButton disabled={!canSave || isSaving} onClick={handleSave}>
                  {isSaving ? t.saving : editingId ? t.updateStory : t.saveStory}
                </PrimaryButton>
                {editingId && (
                  <div className="text-center">
                    <button
                      onClick={() => { setEditingId(null); setEditingPrompt(""); setStoryDraft(""); setImageDraft(""); }}
                      className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 font-sans transition-colors"
                    >
                      {lang === "es" ? "Cancelar edición" : "Cancel editing"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SAVED SUCCESS */}
          {step === "SAVED" && (
            <div className="flex-1 flex flex-col justify-center space-y-10 animate-in zoom-in-95 duration-500 pb-8">
              <div className="text-center space-y-6">
                <div className="text-7xl animate-bounce mb-2">✨</div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{t.storySavedTitle}</h2>
                <p className="text-stone-500 dark:text-stone-400 px-6 font-serif italic text-lg leading-relaxed">{t.storySavedBody}</p>
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
              <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{t.badgeModalTitle}</h2>
              <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg mt-4 px-6">{t.storyKeeperBody(displayName)}</p>
              <div className="space-y-3 pt-6">
                <PrimaryButton onClick={() => setStep("WRITE")}>{t.addAnother}</PrimaryButton>
                <SecondaryButton onClick={() => router.push("/stories")}>{t.viewStories}</SecondaryButton>
              </div>
            </div>
          )}

          <RefineModal
            isOpen={showRefineModal}
            onClose={() => setShowRefineModal(false)}
            originalText={storyDraft}
            prompt={displayQuestion.text}
            lang={lang}
            t={t}
            onAccept={(refined) => setStoryDraft(refined)}
          />

        </div>
      </div>
    </div>
  );
}
