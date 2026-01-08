"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Step, Lang, LastSaved, MemoryItem, Person } from "./types";
import {
  normalize,
  makeId,
  canUseStorage,
  loadJSON,
  saveJSON,
  loadString,
  saveString,
  removeKey,
  currentWeekNumber,
  addMemory,
  wrapIndex,
  plural,
  loadUsedQuestionIndexes,
  saveUsedQuestionIndexes,
  nextUnusedIndex,
  hasBadge,
  addBadge,
  compressImage,
} from "./utils";
import { renderWithBoldName } from "./utils/text";
import { TEXT, LS, QUESTION_EXAMPLES } from "./constants";
import { useSwipe } from "./hooks/useSwipe";
import { PrimaryButton } from "./components/PrimaryButton";
import { SecondaryButton } from "./components/SecondaryButton";
import { ArrowButton } from "./components/ArrowButton";
import { StoryCarousel } from "./components/StoryCarousel";
import { AuthModal } from "./components/AuthModal";
import { useAuth } from "./hooks/useAuth";
import { useDictation } from "./hooks/useDictation";
import { useSync } from "./hooks/useSync";

export default function Page() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const t = TEXT[lang];
  const QUESTIONS = useMemo(() => [t.q1, t.q2, t.q3, t.q4, t.q5], [t]);
  const [people, setPeople] = useState<Person[]>([]);
  const [activePersonId, setActivePersonId] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [step, setStep] = useState<Step>("WELCOME");
  const [nameDraft, setNameDraft] = useState("");
  const [storyDraft, setStoryDraft] = useState("");
  const [imageDraft, setImageDraft] = useState<string>("");
  const suppressAutoSelectRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<number | null>(null);
  const [usedVersion, setUsedVersion] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null);
  const [toast, setToast] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string>("");
  const [inspiration, setInspiration] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const { user, loading: authLoading, error: authError, signUp, signIn, signOut, clearError } = useAuth();

  const { isListening, isSupported, toggleListening } = useDictation(lang, (text) => {
    setStoryDraft((prev) => prev + text);
  });

  // Sync to Cloud
  useSync(people, setPeople);

  useEffect(() => {
    const loadedLang = loadString(LS.lang);
    if (loadedLang === "en" || loadedLang === "es") setLang(loadedLang);
    const loadedPeople = loadJSON<Person[]>(LS.people);
    setPeople(Array.isArray(loadedPeople) ? loadedPeople : []);
    setActivePersonId(loadString(LS.activePersonId));
    const week = currentWeekNumber();
    const storedQ = loadJSON<{ week: number; index: number }>(LS.questionState);
    setQuestionIndex((storedQ && storedQ.week === week) ? storedQ.index % QUESTIONS.length : week % QUESTIONS.length);
    setStep((Array.isArray(loadedPeople) && loadedPeople.length > 0) ? "HOME" : "WELCOME");
    setIsHydrated(true);
  }, [QUESTIONS.length]);

  useEffect(() => {
    if (people.length === 0) { if (isHydrated) setActivePersonId(""); return; }
    if (suppressAutoSelectRef.current) { suppressAutoSelectRef.current = false; return; }
    if (!activePersonId || !people.some((p) => p.id === activePersonId)) setActivePersonId(people[0].id);
  }, [people, activePersonId, isHydrated]);

  const activePerson = useMemo(() => people.find((p) => p.id === activePersonId) || null, [people, activePersonId]);
  const safeName = useMemo(() => normalize(activePerson?.name || ""), [activePerson?.name]);
  const displayName = safeName || normalize(nameDraft);
  const activeMemories = activePerson?.memories ?? [];
  const usedSet = useMemo(() => new Set<number>(loadUsedQuestionIndexes(activePersonId || "")), [activePersonId, usedVersion]);
  const storyKeeperEarned = useMemo(() => activePersonId ? hasBadge(activePersonId, "story_keeper") : false, [activePersonId, badgeVersion]);
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

  useEffect(() => { if (isHydrated) saveJSON(LS.people, people); }, [people, isHydrated]);
  useEffect(() => { if (isHydrated) saveString(LS.activePersonId, activePersonId); }, [activePersonId, isHydrated]);
  useEffect(() => { if (isHydrated) saveString(LS.lang, lang); }, [lang, isHydrated]);
  useEffect(() => { if (isHydrated) saveJSON(LS.questionState, { week: currentWeekNumber(), index: questionIndex }); }, [questionIndex, isHydrated]);
  useEffect(() => {
    const tick = () => { const week = currentWeekNumber(); const stored = loadJSON<{ week: number; index: number }>(LS.questionState); if (stored && stored.week === week) return; setQuestionIndex(week % QUESTIONS.length); };
    tick(); if (typeof window === "undefined") return; const id = window.setInterval(tick, 60_000); return () => window.clearInterval(id);
  }, [QUESTIONS.length]);

  function showToast(msg: string) { setToast(msg); if (typeof window === "undefined") return; window.setTimeout(() => setToast(""), 2200); }
  useEffect(() => { if (!activePersonId) return; const key = `${LS.draftPrefix}${activePersonId}`; const saved = loadString(key); if (saved && !normalize(storyDraft) && !editingId) setStoryDraft(saved); }, [activePersonId, editingId]);
  useEffect(() => {
    if (!activePersonId || typeof window === "undefined" || editingId) return;
    const key = `${LS.draftPrefix}${activePersonId}`; if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => { const val = storyDraft; if (!normalize(val)) removeKey(key); else saveString(key, val); }, 350);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [storyDraft, activePersonId, editingId]);

  function goPrevQuestion() { if (allStarterUsed) return; setQuestionIndex((i) => nextUnusedIndex(i, -1, QUESTIONS.length, usedSet)); setInspiration(null); }
  function goNextQuestion() { if (allStarterUsed) return; setQuestionIndex((i) => nextUnusedIndex(i, 1, QUESTIONS.length, usedSet)); setInspiration(null); }
  const questionSwipeHandlers = useSwipe(goNextQuestion, goPrevQuestion);
  const storySwipeHandlers = useSwipe(() => { }, () => { });

  function startNewPerson() { suppressAutoSelectRef.current = true; setActivePersonId(""); setNameDraft(""); setStoryDraft(""); setImageDraft(""); setInspiration(null); setEditingId(null); setEditingPrompt(""); setStep("WELCOME"); }
  function deleteMemory(memoryId: string) { if (!activePersonId) return; setPeople((prev) => prev.map((p) => { if (p.id !== activePersonId) return p; return { ...p, memories: p.memories.filter((m) => m.id !== memoryId) }; })); }
  function startEditing(item: MemoryItem) { setEditingId(item.id); setEditingPrompt(item.prompt); setStoryDraft(item.text); setImageDraft(item.imageUrl || ""); setStep("WRITE"); }
  function inviteFamily() { if (typeof navigator !== "undefined" && navigator.share) { navigator.share({ title: "VitaMyStory", text: t.inviteMsg(displayName), url: window.location.href }).catch(console.error); } else { navigator.clipboard.writeText(`${t.inviteMsg(displayName)} ${window.location.href}`); showToast(t.copied); } }

  function shareMilestone() {
    const text = t.milestoneMsg(displayName);
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "VitaMyStory Milestone", text: text, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      showToast(t.copied);
    }
  }

  function resetApp() {
    if (!canUseStorage()) { setPeople([]); setActivePersonId(""); setNameDraft(""); setStoryDraft(""); setLastSaved(null); setToast(""); setEditingId(null); setEditingPrompt(""); setStep("WELCOME"); return; }
    try {
      window.localStorage.removeItem(LS.people); window.localStorage.removeItem(LS.activePersonId); window.localStorage.removeItem(LS.questionState);
      const prefixes = [LS.draftPrefix, LS.usedPrefix, LS.badgesPrefix]; const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) { const k = window.localStorage.key(i); if (k && prefixes.some((p) => k.startsWith(p))) keysToRemove.push(k); }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch { }
    suppressAutoSelectRef.current = true; setPeople([]); setActivePersonId(""); setNameDraft(""); setStoryDraft(""); setImageDraft(""); setInspiration(null); setLastSaved(null); setToast(""); setEditingId(null); setEditingPrompt(""); setStep("WELCOME"); setUsedVersion((v) => v + 1); setBadgeVersion((v) => v + 1);
  }
  function downloadBackup() {
    if (people.length === 0) return;
    const data = { app: "VitaMyStory", version: "MVP-Demo", exportedAt: new Date().toISOString(), people: people };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = href; link.download = `vita-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast(t.backupDownloaded);
  }

  function markCurrentQuestionUsed(personId: string) { if (!personId || allStarterUsed) return; const idx = wrapIndex(questionIndex, QUESTIONS.length); const used = loadUsedQuestionIndexes(personId); saveUsedQuestionIndexes(personId, [...used, idx]); setUsedVersion((v) => v + 1); }
  function maybeAwardStoryKeeper(personId: string) { if (!personId) return false; const used = loadUsedQuestionIndexes(personId); if (used.length < QUESTIONS.length || hasBadge(personId, "story_keeper")) return false; addBadge(personId, "story_keeper"); setBadgeVersion((v) => v + 1); return true; }
  function advanceToNextUnused(personId: string) { if (!personId) return; const usedNext = new Set<number>(loadUsedQuestionIndexes(personId)); if (usedNext.size >= QUESTIONS.length) return; setQuestionIndex(nextUnusedIndex(questionIndex, 1, QUESTIONS.length, usedNext)); }

  function saveStory() {
    const text = normalize(storyDraft); if (!text) return;
    if (editingId && activePerson) {
      setPeople((prev) => prev.map((p) => (p.id !== activePerson.id ? p : { ...p, memories: p.memories.map((m) => m.id === editingId ? { ...m, text: text, imageUrl: imageDraft } : m) })));
      setLastSaved({ personName: activePerson.name, prompt: editingPrompt, text: text, createdAt: Date.now(), personId: activePerson.id });
      setEditingId(null); setEditingPrompt(""); setStoryDraft(""); setImageDraft(""); setStep("SAVED"); return;
    }
    if (activePerson) {
      const willCompleteStarter = !allStarterUsed && usedSet.size === QUESTIONS.length - 1;
      markCurrentQuestionUsed(activePerson.id);
      setPeople((prev) => prev.map((p) => p.id === activePerson.id ? { ...p, memories: addMemory(p.memories, promptToSave, storyDraft, undefined, imageDraft) } : p));
      setLastSaved({ personName: displayName || activePerson.name, prompt: promptToSave, text: storyDraft, createdAt: Date.now(), personId: activePerson.id });
      removeKey(`${LS.draftPrefix}${activePerson.id}`); setStoryDraft(""); setImageDraft(""); setInspiration(null); advanceToNextUnused(activePerson.id);
      if (willCompleteStarter) { maybeAwardStoryKeeper(activePerson.id); setStep("BADGE"); return; }
      setStep("SAVED"); return;
    }
    const normalizedName = normalize(nameDraft); if (!normalizedName) return;
    const p: Person = { id: makeId(), name: normalizedName, memories: addMemory([], promptToSave, storyDraft, undefined, imageDraft), createdAt: Date.now() };
    setPeople((prev) => [p, ...prev]); setActivePersonId(p.id); saveUsedQuestionIndexes(p.id, [wrapIndex(questionIndex, QUESTIONS.length)]); setUsedVersion((v) => v + 1);
    setLastSaved({ personName: normalizedName, prompt: promptToSave, text: storyDraft, createdAt: Date.now(), personId: p.id });
    removeKey(`${LS.draftPrefix}${p.id}`); setNameDraft(""); setStoryDraft(""); setImageDraft(""); setInspiration(null); advanceToNextUnused(p.id); setStep("SAVED");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setImageDraft(base64);
    } catch (err) {
      console.error(err);
      showToast("Error uploading image");
    }
  }

  const canSave = normalize(storyDraft).length > 0 && normalize(displayName).length > 0;
  const savedCount = activePerson ? activePerson.memories.length : lastSaved ? 1 : 0;

  async function handleLogout() {
    await signOut();
    setPeople([]);
    setActivePersonId("");
    setNameDraft("");
    setStoryDraft("");
    setStoryDraft("");
    setStep("WELCOME");
  }

  if (!isHydrated) return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-900"></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-900 selection:bg-stone-200">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        :root { --font-sans: 'Inter', sans-serif; --font-serif: 'Libre Baskerville', serif; }
        .font-sans { font-family: var(--font-sans); }
        .font-serif { font-family: var(--font-serif); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-full max-w-lg px-4 font-sans">

        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden relative border border-stone-100 min-h-[600px] flex flex-col">
          <div className="p-8 flex-1 flex flex-col">
            {toast ? <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2 rounded-full text-sm font-sans font-medium shadow-lg animate-fade-in z-50">{toast}</div> : null}

            {user && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-sans z-40">
                <span className="text-stone-400">{user.email}</span>
                <button onClick={handleLogout} className="text-stone-300 hover:text-stone-500 underline">{t.logout}</button>
              </div>
            )}

            {step === "WELCOME" && (
              <div className="flex-1 flex flex-col justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 relative">
                <div className="absolute top-6 right-6 flex gap-3 text-xs font-bold tracking-widest z-10 font-sans">
                  <button onClick={() => setLang("es")} className={`transition-colors ${lang === "es" ? "text-stone-900 underline decoration-2 underline-offset-4" : "text-stone-300 hover:text-stone-500"}`}>ES</button>
                  <button onClick={() => setLang("en")} className={`transition-colors ${lang === "en" ? "text-stone-900 underline decoration-2 underline-offset-4" : "text-stone-300 hover:text-stone-500"}`}>EN</button>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900">{t.welcomeTitle}</h1>
                  <p className="text-stone-500 text-lg leading-relaxed max-w-xs mx-auto font-serif">{t.welcomeBody}</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400 font-sans">{t.whoFor}</label>
                    <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder={t.placeholder} className="w-full bg-transparent border-b-2 border-stone-100 p-2 text-center text-3xl font-serif text-stone-800 placeholder:text-stone-200 focus:outline-none focus:border-stone-400 transition-colors" autoFocus />
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  <PrimaryButton disabled={!normalize(nameDraft)} onClick={() => setStep("INTRO")}>{t.continue}</PrimaryButton>
                  {people.length > 0 ? <button onClick={() => setStep("PEOPLE")} className="text-sm text-stone-400 hover:text-stone-600 transition-colors font-sans">{t.chooseExisting}</button> : null}
                </div>
                <div className="mt-8 bg-stone-50 border border-stone-200 rounded-lg p-4 text-left font-sans">
                  <div className="flex items-start gap-3">
                    <div className="text-stone-400 mt-0.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
                    <div><h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-1">{t.demoNoteTitle}</h4><p className="text-xs text-stone-500 leading-relaxed">{t.demoNoteBody}</p></div>
                  </div>
                </div>
                {!user && (
                  <div className="mt-4 flex justify-center gap-4">
                    <button onClick={() => setStep("LOGIN")} className="text-sm text-stone-400 hover:text-stone-600 underline font-sans">{t.login}</button>
                    <button onClick={() => setStep("REGISTER")} className="text-sm text-stone-400 hover:text-stone-600 underline font-sans">{t.register}</button>
                  </div>
                )}
              </div>
            )}

            {step === "INTRO" && (
              <div className="flex-1 flex flex-col justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-6 px-4">
                  <div className="text-5xl animate-pulse">🕯️</div>
                  <h2 className="text-3xl font-serif text-stone-900 leading-tight">{t.introTitle}</h2>
                  <p className="text-stone-500 text-lg leading-relaxed whitespace-pre-line font-serif">{renderWithBoldName(t.introBody(nameDraft))}</p>
                </div>
                <div className="pt-4"><PrimaryButton onClick={() => setStep("WRITE")}>{t.startWriting}</PrimaryButton></div>
              </div>
            )}

            {step === "WRITE" && (
              <div {...questionSwipeHandlers} className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300 touch-pan-y">
                <div className="text-center space-y-2 mb-8">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-400 font-sans">
                    {editingId ? "EDITING" : allStarterUsed ? t.freeChapter : t.starterProgress(starterProgressIndex, starterTotal)}
                  </div>



                  <h2 className="text-xl font-serif font-normal leading-relaxed text-stone-800">
                    {renderWithBoldName(displayQuestion.text)}
                  </h2>

                  <div className="mt-6 mb-6 min-h-[40px] flex items-center justify-center">
                    {!allStarterUsed && !editingId && (
                      <button
                        onClick={() => {
                          const idx = wrapIndex(questionIndex, QUESTIONS.length);
                          // @ts-ignore - Index is safe due to math
                          const example = QUESTION_EXAMPLES[lang][idx];
                          setInspiration(example);
                        }}
                        className={`text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 py-2 ${inspiration ? "text-stone-600" : "text-stone-400 hover:text-stone-600"}`}
                      >
                        <span>✨ {t.inspireMe}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 relative mb-4 -mt-2">
                  <div className="absolute inset-0 bg-stone-50 rounded-xl border border-stone-200 shadow-inner z-0 overflow-hidden">
                    {imageDraft && (
                      <div className="h-48 w-full relative">
                        <img src={imageDraft} className="w-full h-full object-cover opacity-50 absolute inset-0" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-50"></div>
                        <button onClick={() => setImageDraft("")} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 z-30"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                      </div>
                    )}
                  </div>
                  <textarea value={storyDraft} onChange={(e) => setStoryDraft(e.target.value)} placeholder={inspiration || t.writePlaceholder} className={`absolute inset-0 w-full h-full resize-none bg-transparent p-6 text-2xl font-serif leading-relaxed text-stone-800 placeholder:font-serif placeholder:italic placeholder:text-xl placeholder:text-stone-300 focus:outline-none z-10 ${imageDraft ? "pt-32" : ""}`} />

                  {isSupported && (
                    <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-full shadow-lg border transition-all ${imageDraft
                          ? "bg-stone-800 text-white border-stone-900"
                          : "bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:scale-105"}`}
                        title="Add photo"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      </button>

                      <button
                        onClick={toggleListening}
                        className={`p-3 rounded-full shadow-lg border transition-all ${isListening
                          ? "bg-red-50 text-red-600 border-red-200 animate-pulse scale-110"
                          : "bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:scale-105"
                          }`}
                        title={t.tapToSpeak}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      </button>
                    </div>
                  )}

                  {!editingId && (<><div className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-auto"><ArrowButton direction="left" onClick={goPrevQuestion} disabled={allStarterUsed} /></div><div className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 pointer-events-auto"><ArrowButton direction="right" onClick={goNextQuestion} disabled={allStarterUsed} /></div></>)}
                </div>
                <div className="space-y-4">
                  <PrimaryButton disabled={!canSave} onClick={saveStory}>{editingId ? t.updateStory : t.saveStory}</PrimaryButton>
                  {people.length > 0 && (<div className="text-center"><button onClick={() => { if (editingId) { setEditingId(null); setEditingPrompt(""); setStoryDraft(""); } setStep("HOME") }} className="text-sm text-stone-400 hover:text-stone-600 font-sans">{editingId ? "Cancel editing" : t.viewStories}</button></div>)}
                </div>
              </div>
            )}

            {step === "SAVED" && (
              <div className="flex-1 flex flex-col justify-center space-y-8 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    {savedCount === 1 ? (<div className="text-6xl animate-bounce mb-2">✨</div>) : savedCount === 2 ? (<div className="text-6xl animate-bounce mb-2">🗝️</div>) : (<div className="bg-green-50 text-green-600 p-3 rounded-full"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>)}
                  </div>
                  <h2 className="text-3xl font-serif text-stone-900 leading-tight">{savedCount === 1 ? t.firstStoryTitle : savedCount === 2 ? t.secondStoryTitle : t.storySavedTitle}</h2>
                  <p className="text-stone-500 px-6 font-sans">{savedCount === 1 ? t.firstStoryBody : savedCount === 2 ? t.secondStoryBody : t.storySavedBody}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-8 text-center relative shadow-inner">
                  <span className="absolute top-4 left-4 text-4xl text-stone-200 font-serif leading-none">“</span>
                  <p className="text-lg font-serif italic text-stone-700 leading-relaxed">{lastSaved?.text}</p>
                  <span className="absolute bottom-[-10px] right-4 text-4xl text-stone-200 font-serif leading-none">”</span>
                </div>
                <div className="space-y-3 pt-4"><PrimaryButton onClick={() => setStep("WRITE")}>{t.addAnother}</PrimaryButton><SecondaryButton onClick={() => setStep("HOME")}>{t.viewAllStories(displayName)}</SecondaryButton></div>
                <div className="text-center"><button onClick={inviteFamily} className="text-xs text-stone-400 hover:text-stone-600 underline font-sans">{t.invite}</button></div>
              </div>
            )}

            {step === "BADGE" && (
              <div className="flex-1 flex flex-col justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="space-y-4">
                  <div className="text-8xl animate-bounce">📖</div>
                  <p className="text-stone-500 font-sans mt-4 px-6">{t.storyKeeperBody(displayName)}</p>
                </div>
                <div className="space-y-3">
                  <PrimaryButton onClick={() => setStep("WRITE")}>{t.addAnother}</PrimaryButton>
                  <SecondaryButton onClick={() => setStep("HOME")}>{t.viewStories}</SecondaryButton>
                </div>
                <div className="text-center pt-2">
                  <button onClick={shareMilestone} className="text-xs text-stone-400 hover:text-stone-600 underline font-sans tracking-wide">
                    {t.shareMilestone}
                  </button>
                </div>
              </div>
            )}

            {step === "HOME" && (
              <div {...storySwipeHandlers} className="flex-1 flex flex-col animate-in fade-in duration-500 touch-pan-y relative">
                {/* MODAL FOR BADGE */}
                {showBadgeModal && (
                  <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 font-sans text-center">
                    <div className="text-8xl mb-6 animate-bounce">📖</div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-2">{t.badgeModalTitle}</h3>
                    <p className="text-stone-500 mb-8 leading-relaxed px-4">{t.badgeModalBody}</p>
                    <PrimaryButton onClick={() => setShowBadgeModal(false)}>{t.close}</PrimaryButton>
                  </div>
                )}

                <div className="mb-6 text-left pl-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 font-sans">{activeMemories.length === 1 ? t.storyOf : t.storiesOf}</div>
                    {storyKeeperEarned && (
                      <button
                        className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                        title={t.storyKeeperTooltip}
                        onClick={() => setShowBadgeModal(true)}
                      >
                        📖
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-none">{safeName}</h1>
                    {people.length > 1 && (<button onClick={() => setStep("PEOPLE")} className="self-end mb-1 text-[10px] uppercase font-bold tracking-wider text-stone-300 hover:text-stone-500 transition-colors font-sans">({t.change})</button>)}
                  </div>
                </div>
                <div className="flex-1">
                  {activeMemories.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-stone-100 rounded-2xl">
                      <div className="text-stone-200 mb-4"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg></div>
                      <p className="text-stone-400 font-serif italic">{t.emptyHome}</p>
                    </div>
                  ) : (<StoryCarousel items={[...activeMemories].reverse()} lang={lang} onDelete={deleteMemory} onEdit={startEditing} />)}
                </div>
                <div className="mt-10 space-y-3">
                  <PrimaryButton onClick={() => setStep("WRITE")}>{t.writeAStory}</PrimaryButton>
                  <div className="flex gap-3">
                    <SecondaryButton className="flex-1" onClick={startNewPerson}>{t.newPerson}</SecondaryButton>
                    <div className="relative flex-1 group"><SecondaryButton onClick={downloadBackup}>{t.saveBackup}</SecondaryButton></div>
                  </div>
                </div>
              </div>
            )}

            {step === "PEOPLE" && (
              <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                <h2 className="text-center text-lg font-serif font-bold text-stone-900 mb-8">{t.choosePerson}</h2>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {people.length === 0 ? (
                    <div className="text-center text-stone-400 py-10 font-sans">{t.noPeople}</div>
                  ) : (
                    people.map((p) => (
                      <button key={p.id} onClick={() => { setActivePersonId(p.id); setStep("HOME"); }} className={`w-full text-left p-5 rounded-xl transition-all ${p.id === activePersonId ? "bg-stone-900 text-white shadow-md" : "bg-stone-50 text-stone-600 hover:bg-stone-100"}`}>
                        <div className="text-xl font-serif leading-none mb-2">{p.name}</div>
                        <div className={`text-xs uppercase tracking-wider font-sans ${p.id === activePersonId ? "text-stone-400" : "text-stone-400"}`}>{p.memories.length} {plural(p.memories.length, "story", lang === "es" ? "historias" : "stories")}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className="pt-6 space-y-3"><PrimaryButton onClick={startNewPerson}>{t.newPerson}</PrimaryButton><button onClick={() => setStep("HOME")} className="w-full py-3 text-sm text-stone-400 hover:text-stone-600 font-sans">{t.back}</button></div>
              </div>
            )}

            {(step === "LOGIN" || step === "REGISTER") && (
              <AuthModal
                mode={step === "LOGIN" ? "login" : "register"}
                lang={lang}
                loading={authLoading}
                error={authError}
                onSubmit={async (email, password) => {
                  const success = step === "LOGIN"
                    ? await signIn(email, password)
                    : await signUp(email, password);
                  if (success) {
                    setStep(people.length > 0 ? "HOME" : "WELCOME");
                  }
                }}
                onToggleMode={() => setStep(step === "LOGIN" ? "REGISTER" : "LOGIN")}
                onClose={() => setStep("WELCOME")}
                onClearError={clearError}
              />
            )}
          </div>
        </div>
        <div className="text-center py-6 space-y-2"><button onClick={resetApp} className="text-[10px] uppercase tracking-widest text-stone-300 hover:text-stone-500 transition-colors font-sans">{t.resetApp}</button></div>
      </div>
    </div>
  );
}