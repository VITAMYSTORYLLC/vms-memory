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
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useMemory } from "./context/MemoryContext";
import { useRouter } from "next/navigation";
import { Haptics } from "./utils/haptics";
import { RefineModal } from "./components/RefineModal";
import { useAuth } from "./hooks/useAuth";
import { shareBlankQuestion, getBlankQuestionsForPerson } from "./utils/engagement";

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
    isPhotoMode, setIsPhotoMode,
    isAudioMode, setIsAudioMode,
    isCustomMode, setIsCustomMode,
    isAIMode, setIsAIMode,
    aiCurrentQuestionIndex, setAICurrentQuestionIndex,
    generateAIQuestions,
    audioDraft, setAudioDraft
  } = useMemory();

  const router = useRouter();
  const { user } = useAuth();
  const QUESTIONS = useMemo(() => [t.q1, t.q2, t.q3, t.q4, t.q5], [t]);

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [step, setStep] = useState<Step>("WELCOME");
  const [usedVersion, setUsedVersion] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSharingBlank, setIsSharingBlank] = useState(false);
  const [blankSharedLink, setBlankSharedLink] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastActivity = useRef(Date.now());

  // Audio Recorder
  const {
    isRecording,
    timeLeft,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  // Sync audioBlob with context when recording stops
  useEffect(() => {
    if (audioBlob) {
      setAudioDraft(audioBlob);
    }
  }, [audioBlob, setAudioDraft]);

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

  // Auto-open file picker in Photo Mode
  useEffect(() => {
    if (isPhotoMode && !imageDraft) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 600);
    }
  }, [isPhotoMode, imageDraft]);

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

  // Ensure we don't stay on a used question
  useEffect(() => {
    if (usedSet.size >= QUESTIONS.length) return;
    const current = wrapIndex(questionIndex, QUESTIONS.length);
    if (usedSet.has(current)) {
      const next = nextUnusedIndex(current, 1, QUESTIONS.length, usedSet);
      if (next !== current) {
        setQuestionIndex(next);
      }
    }
  }, [usedSet, questionIndex, QUESTIONS.length]);

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
    if (isAIMode && activePerson?.aiQuestions && activePerson.aiQuestions.length > 0) {
      const aiQuestion = activePerson.aiQuestions[aiCurrentQuestionIndex] || activePerson.aiQuestions[0];
      return { type: "ai" as const, text: aiQuestion };
    }
    if (isCustomMode) return { type: "custom" as const, text: editingPrompt };
    if (editingId && editingPrompt) return { type: "plain" as const, text: editingPrompt };
    if (isPhotoMode) return { type: "photo" as const, text: t.qPhoto(displayName) };
    if (isAudioMode) return { type: "audio" as const, text: t.qAudio(displayName) };
    if (allStarterUsed) return { type: "free" as const, text: t.qFree };
    const q = currentQuestion; const name = displayName;
    if (q.includes("known for") || q.includes("conocidos")) return { type: "knownFor" as const, text: t.qKnownFor(name) };
    if (q.includes("describe") || q.includes("describirías")) return { type: "describe" as const, text: t.qDescribe(name) };
    if (q.includes("first memory") || q.includes("primer recuerdo")) return { type: "firstMemory" as const, text: t.qFirstMemory(name) };
    if (q.includes("everyone to know") || q.includes("todos sepan")) return { type: "everyoneKnow" as const, text: t.qEveryoneKnow(name) };
    if (q.includes("mattered most") || q.includes("más les importaba")) return { type: "matteredMost" as const, text: t.qMatteredMost(name) };
    return { type: "plain" as const, text: q };
  }, [allStarterUsed, currentQuestion, displayName, t, editingId, editingPrompt, isPhotoMode, isAudioMode, isCustomMode, isAIMode, activePerson, aiCurrentQuestionIndex]);

  const promptToSave = useMemo(() => {
    if (isCustomMode) return editingPrompt || t.newStoryTitle;
    if (editingId && editingPrompt) return editingPrompt;
    return allStarterUsed ? "" : displayQuestion.text;
  }, [allStarterUsed, displayQuestion.text, editingId, editingPrompt, isCustomMode, t]);
  const usedCount = usedSet.size; const starterTotal = QUESTIONS.length;
  const starterProgressIndex = useMemo(() => Math.min(starterTotal, Math.max(1, usedCount + 1)), [starterTotal, usedCount]);

  function goPrevQuestion() { if (allStarterUsed) return; setQuestionIndex((i) => nextUnusedIndex(i, -1, QUESTIONS.length, usedSet)); setInspiration(null); }
  function goNextQuestion() {
    if (isAIMode && activePerson?.aiQuestions) {
      const nextIndex = (aiCurrentQuestionIndex + 1) % activePerson.aiQuestions.length;
      setAICurrentQuestionIndex(nextIndex);
      setInspiration(null);
      return;
    }
    if (allStarterUsed) return;
    setQuestionIndex((i) => nextUnusedIndex(i, 1, QUESTIONS.length, usedSet));
    setInspiration(null);
  }
  const questionSwipeHandlers = useSwipe(goNextQuestion, goPrevQuestion);

  function markCurrentQuestionUsed(personId: string) { if (!personId || allStarterUsed) return; const idx = wrapIndex(questionIndex, QUESTIONS.length); saveUsedQuestionIndexes(personId, [...Array.from(usedSet), idx]); setUsedVersion((v) => v + 1); }
  function maybeAwardStoryKeeper(personId: string) { if (!personId) return false; const used = loadUsedQuestionIndexes(personId); if (used.length < QUESTIONS.length || hasBadge(personId, "story_keeper")) return false; addBadge(personId, "story_keeper"); setBadgeVersion((v) => v + 1); return true; }
  function advanceToNextUnused(personId: string) { if (!personId) return; const usedNext = new Set<number>(loadUsedQuestionIndexes(personId)); if (usedNext.size >= QUESTIONS.length) return; setQuestionIndex(nextUnusedIndex(questionIndex, 1, QUESTIONS.length, usedNext)); }

  // Auto-skip any question that already has a family answer
  useEffect(() => {
    if (!activePersonId || !user?.uid || allStarterUsed) return;
    getBlankQuestionsForPerson(user.uid, activePersonId).then((blanks) => {
      blanks.forEach((bq) => {
        if (bq.answers.length > 0) {
          const used = new Set<number>(loadUsedQuestionIndexes(activePersonId));
          if (!used.has(bq.questionIndex)) {
            saveUsedQuestionIndexes(activePersonId, [...Array.from(used), bq.questionIndex]);
            setUsedVersion((v) => v + 1);
          }
        }
      });
    }).catch(() => { });
  }, [activePersonId, user?.uid, allStarterUsed]);

  async function handleShareBlank() {
    if (!user || !activePerson) return;
    setIsSharingBlank(true);
    try {
      const qIdx = wrapIndex(questionIndex, QUESTIONS.length);
      const rawPrompt = displayQuestion.text.replace(/\|\|\|[^|]+\|\|\|/g, activePerson.name);
      const shareId = await shareBlankQuestion(
        activePerson.id,
        activePerson.name,
        user.uid,
        user.displayName || user.email?.split("@")[0] || "Someone",
        rawPrompt,
        qIdx
      );
      const link = `${window.location.origin}/blank/${shareId}`;
      const shareText = lang === "es"
        ? `Hola 💛 Estoy usando VitaMyStory para preservar la historia de vida de ${activePerson.name}.\n\nTengo esta pregunta y pensé que tú podrías ayudarme a responderla:\n\n"${rawPrompt}"\n\n¿Puedes compartir tu memoria?`
        : `Hi 💛 I'm using VitaMyStory to preserve the life story of ${activePerson.name}.\n\nI have this question and thought you could help me answer it:\n\n"${rawPrompt}"\n\nCan you share your memory?`;
      if (navigator.share) {
        await navigator.share({ title: "VitaMyStory", text: shareText, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        setBlankSharedLink(link);
      }
    } catch (err: any) {
      // AbortError = user dismissed the share sheet — not a real error
      if (err?.name === "AbortError") return;
      console.error("Share blank error:", err);
      const msg = err?.code === "permission-denied" || err?.code === "firestore/permission-denied"
        ? (lang === "es" ? "Sin permiso. Verifica las reglas de Firestore." : "Permission denied. Check your Firestore rules.")
        : (err?.message || "Failed to create share link");
      addNotification(t.error, msg, "error");
    } finally {
      setIsSharingBlank(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    const questionIdToSave = (allStarterUsed || isCustomMode) ? "free" : `q_${wrapIndex(questionIndex, QUESTIONS.length)}`;
    const savedPersonId = await saveStory(promptToSave, questionIdToSave);
    if (!savedPersonId) {
      setIsSaving(false);
      return;
    }
    Haptics.success();
    const willCompleteStarter = !allStarterUsed && usedSet.size === QUESTIONS.length - 1;
    markCurrentQuestionUsed(savedPersonId);
    advanceToNextUnused(savedPersonId);
    if (willCompleteStarter) {
      addNotification(t.unlockedModesTitle, t.unlockedModesBody);
      setStep("BADGE");
    } else {
      setStep("SAVED");
    }
    setIsSaving(false);
    setIsPhotoMode(false);
    setIsAudioMode(false);
    setIsCustomMode(false);
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

  async function handleGenerateMoreQuestions() {
    if (!activePerson) return;
    setIsGeneratingAI(true);
    try {
      await generateAIQuestions(activePerson.id);
      // Reset to first question after generating new ones
      setAICurrentQuestionIndex(0);
    } catch (error) {
      console.error("Failed to generate more questions:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  }

  const canSave = (normalize(storyDraft).length > 0 || imageDraft.length > 0 || audioDraft) && normalize(displayName).length > 0;

  if (!isHydrated) return <div className="min-h-screen bg-[#F9F8F6]"></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-midnight-950 text-stone-900 dark:text-stone-100 selection:bg-stone-200 dark:selection:bg-stone-800 safe-top safe-bottom pb-24 transition-colors duration-500">
      <div className="w-full max-w-lg sm:px-4 font-sans h-full sm:h-auto">
        <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex-1 flex flex-col overflow-hidden">

          {/* MAIN WRITE FLOW */}
          {step === "WRITE" && (
            <div {...questionSwipeHandlers} className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500 touch-pan-y overflow-hidden pt-4 sm:pt-0">
              <div className="text-center space-y-2 mb-4 sm:mb-6 flex-shrink-0 h-[260px] flex flex-col justify-end pb-2 relative group">
                {!(isCustomMode || isPhotoMode || isAudioMode || isAIMode) && (
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-700 font-sans">
                    {editingId ? (lang === "es" ? "EDITANDO" : "EDITING") : allStarterUsed ? t.freeChapter : `${t.chapter} ${starterProgressIndex} ${t.of} ${starterTotal}`}
                  </div>
                )}
                <h2 className="text-2xl sm:text-3xl font-serif leading-[1.15] sm:leading-snug text-stone-900 dark:text-stone-100 px-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {isCustomMode ? (
                    <input
                      value={editingPrompt}
                      onChange={(e) => setEditingPrompt(e.target.value)}
                      placeholder={t.customStoryPlaceholder}
                      className="w-full text-center bg-transparent border-b border-stone-200 dark:border-stone-800 focus:border-stone-500 focus:outline-none placeholder:text-stone-300 dark:placeholder:text-stone-700 placeholder:italic transition-colors"
                      autoFocus
                    />
                  ) : (
                    renderWithBoldName(displayQuestion.text)
                  )}
                </h2>
                <div className="min-h-[44px] flex items-center justify-center pt-3 relative gap-3">
                  {normalize(storyDraft).length > 20 ? (
                    <button
                      onClick={() => setShowRefineModal(true)}
                      className={`w-[180px] flex justify-center text-xs font-bold uppercase tracking-[0.15em] transition-all items-center gap-2 py-3 bg-gradient-to-r from-stone-800 to-stone-900 dark:from-stone-100 dark:to-stone-300 text-white dark:text-stone-900 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 ${isCustomMode ? '' : 'animate-fadeInUp'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={isCustomMode ? '' : 'animate-pulse'}>✨</span>
                        {isCustomMode ? (
                          <span>{t.refineStory}</span>
                        ) : (
                          <span className="flex">
                            {t.refineStory.split("").map((char, index) => (
                              <span
                                key={index}
                                className="opacity-0 animate-fadeInUp inline-block"
                                style={{ animationDelay: `${700 + index * 50}ms`, animationFillMode: "both" }}
                              >
                                {char === " " ? "\u00A0" : char}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  ) : (
                    (!allStarterUsed || isAIMode) && !editingId && !isPhotoMode && !isAudioMode && !isCustomMode && (
                      <>
                        <button
                          onClick={() => {
                            const idx = wrapIndex(questionIndex, QUESTIONS.length);
                            // @ts-ignore
                            const example = QUESTION_EXAMPLES[lang][idx];
                            setInspiration(example);
                          }}
                          className={`flex justify-center text-xs font-bold uppercase tracking-[0.15em] transition-all items-center gap-2 py-2.5 px-6 bg-white/50 dark:bg-midnight-900/50 rounded-full border border-stone-100 dark:border-stone-800 animate-in fade-in duration-300 ${inspiration ? "text-stone-900 dark:text-stone-100 bg-white dark:bg-midnight-900 shadow-sm border-white dark:border-stone-700" : "text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 hover:bg-white dark:hover:bg-stone-900"}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-stone-300 dark:text-stone-700">💡</span>
                            {t.inspireMe}
                          </span>
                        </button>

                        <button
                          onClick={goNextQuestion}
                          className="absolute left-0 bottom-1 p-4 bg-stone-100 dark:bg-midnight-800 hover:bg-stone-200 dark:hover:bg-midnight-700 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-all shadow-sm animate-in fade-in duration-300 hover:scale-110 active:scale-95"
                          title={t.changeQuestion || "Change Question"}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                          </svg>
                        </button>
                      </>
                    )
                  )}

                  {isAIMode && (
                    <button
                      onClick={handleGenerateMoreQuestions}
                      disabled={isGeneratingAI}
                      className="absolute right-0 bottom-1 p-4 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-full text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-all shadow-sm animate-in fade-in duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isGeneratingAI ? t.generatingQuestions : t.generateMoreQuestions}
                    >
                      {isGeneratingAI ? (
                        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                          <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                          <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="h-96 relative flex flex-col min-h-0 mb-8 bg-white dark:bg-midnight-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden transition-colors">
                {isAudioMode ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-500 z-20">
                    {/* Audio Recorder Controls */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
                      {audioDraft ? (
                        <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
                          <div className="bg-stone-100 dark:bg-midnight-800 rounded-2xl p-6 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-stone-200 dark:bg-midnight-700 flex items-center justify-center text-stone-500 dark:text-stone-400">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                            </div>
                            <audio controls src={URL.createObjectURL(audioDraft)} className="w-full" />
                          </div>

                          <button
                            onClick={() => {
                              setAudioDraft(null);
                              resetRecording();
                            }}
                            className="text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            {t.change || "Retake"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className={`text-6xl font-serif font-bold tabular-nums transition-colors ${isRecording ? "text-red-500 animate-pulse" : "text-stone-300 dark:text-stone-700"}`}>
                            0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                          </div>
                          <p className="font-serif text-lg text-stone-400 dark:text-stone-600 italic">
                            {isRecording ? (lang === "es" ? "Grabando..." : "Recording...") : t.tapToSpeak}
                          </p>
                        </>
                      )}
                    </div>

                    {!audioDraft && (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-6 rounded-full shadow-xl border-4 transition-all duration-300 transform ${isRecording
                          ? "bg-red-500 border-red-100 dark:border-red-900 text-white scale-125 shadow-red-500/30"
                          : "bg-stone-900 dark:bg-stone-100 border-stone-100 dark:border-stone-800 text-white dark:text-stone-900 hover:scale-110 hover:shadow-2xl"
                          }`}
                      >
                        {isRecording ? (
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="6" width="12" height="12" fill="currentColor"></rect>
                          </svg>
                        ) : (
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ) : isPhotoMode ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in duration-500 z-20">
                    {imageDraft ? (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm group">
                        <img src={imageDraft} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/90 text-stone-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg transform hover:scale-105 transition-all"
                          >
                            {t.change}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl hover:bg-stone-50 dark:hover:bg-midnight-800/50 transition-colors group cursor-pointer"
                      >
                        <div className="p-6 rounded-full bg-stone-100 dark:bg-midnight-800 text-stone-400 dark:text-stone-500 group-hover:scale-110 transition-transform mb-4">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        </div>
                        <span className="font-serif text-lg text-stone-400 dark:text-stone-500 italic">
                          {t.newPhotoSubtitle}
                        </span>
                      </button>
                    )}
                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                  </div>
                ) : (
                  <>
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

                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                  </>
                )}


              </div>

              <div className="space-y-6 flex-shrink-0 pb-8 sm:pb-4">
                <PrimaryButton disabled={!canSave || isSaving} onClick={handleSave}>
                  {isSaving ? t.saving : editingId ? t.updateStory : t.saveStory}
                </PrimaryButton>

                {/* Share with family — only when text is empty, logged in, not a special mode */}
                {user && !editingId && !isPhotoMode && !isAudioMode && !isCustomMode && !isAIMode && !allStarterUsed && normalize(storyDraft).length === 0 && (
                  <div className="text-center">
                    {blankSharedLink ? (
                      <div className="flex flex-col items-center gap-1 animate-in fade-in duration-300">
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                          {lang === "es" ? "✓ ¡Enlace copiado!" : "✓ Link copied!"}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 break-all max-w-[260px]">{blankSharedLink}</span>
                        <button
                          onClick={() => setBlankSharedLink(null)}
                          className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                        >
                          {lang === "es" ? "Cerrar" : "Dismiss"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleShareBlank}
                        disabled={isSharingBlank}
                        className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-[#8B7355] dark:hover:text-[#C49A6C] transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                      >
                        {isSharingBlank
                          ? <span className="inline-block w-3 h-3 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                          : <span>↗</span>
                        }
                        {lang === "es" ? "Compartir con familia para responder" : "Share with family to answer"}
                      </button>
                    )}
                  </div>
                )}

                {(editingId || isPhotoMode || isAudioMode || isCustomMode) && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingPrompt("");
                        setStoryDraft("");
                        setImageDraft("");
                        setIsPhotoMode(false);
                        setIsAudioMode(false);
                        setIsCustomMode(false);
                        if (activePerson && activePerson.memories.length > 0) {
                          router.push("/stories");
                        }
                      }}
                      className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 font-sans transition-colors"
                    >
                      {lang === "es" ? "Cancelar" : "Cancel"}
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
              <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg mt-4 px-6">{renderWithBoldName(t.storyKeeperBody(displayName))}</p>
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


          <div className="text-[9px] font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700 text-center py-4 opacity-30 select-none">
            v. Feb 12
          </div>
        </div>
      </div>
    </div>
  );
}
