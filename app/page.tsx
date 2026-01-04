"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Step = "WELCOME" | "WRITE" | "SAVED" | "BADGE" | "HOME" | "PEOPLE" | "INTRO";
type Lang = "en" | "es";

const TEXT = {
  en: {
    welcomeTitle: "VitaMyStory",
    welcomeBody: "A simple place to collect the stories that matter.",
    savedDevice: "Stories live on this device.",
    demoNoteTitle: "How this Demo works",
    demoNoteBody: "Your stories are saved safely in your browser. You can export a backup at any time to keep them forever.",
    whoFor: "Who are we writing about?",
    placeholder: "Grandma Elvia",
    justName: "Just a name to start a chapter.",
    continue: "Continue",
    chooseExisting: "Or choose an existing person",
    introTitle: "A sanctuary for memories",
    introBody: (name: string) => 
      `VitaMyStory is where we ensure |||${name}'s||| legacy never fades.\n\nThere is no rush here. Take your time. Capture one story at a time and share them with your family.`,
    startWriting: "Start Writing",
    writeTitle: "Share a memory",
    writeSubtitle: "Don't overthink it. A few sentences is perfect.",
    writePlaceholder: "Start writing here...",
    saveStory: "Save this memory",
    updateStory: "Update memory",
    viewStories: "Read stories",
    viewAllStories: (name: string) => `Read all stories about ${name}`,
    addAnother: "Write another",
    invite: "Invite family", 
    inviteMsg: (name: string) => `I am capturing ${name}'s stories on VitaMyStory. Join me.`,
    milestoneMsg: (name: string) => `Look what I did with ${name}'s story! I just unlocked the Story Keeper badge on VitaMyStory.`,
    shareMilestone: "Share this milestone with your family",
    storySaved: "Memory kept.",
    storyShared: "Story shared",
    firstStorySaved: "First memory saved.",
    firstStorySavedPerson: (name: string) => `Your first story about ${name} is safe.`,
    storySavedTitle: "Memory kept.",
    storySavedBody: "This moment is safe.",
    firstStoryTitle: "The first chapter begins.",
    firstStoryBody: "You have started a legacy.",
    secondStoryTitle: "Two stories saved.",
    secondStoryBody: "You are building momentum. Complete 5 stories to unlock special features.",
    storyKeeperTitle: "Story Keeper",
    storyKeeperBody: (name: string) =>
      `You’ve preserved the first chapter of ${name}’s legacy.`,
    storyKeeperBadge: "Story Keeper",
    storiesOf: "THE STORIES OF",
    storyOf: "THE STORY OF",
    change: "Change",
    emptyHome: "A blank page waiting for memories. Start whenever you’re ready.",
    writeAStory: "Write a story",
    newPerson: "New person",
    resetApp: "Reset app",
    choosePerson: "Select a person",
    noPeople: "No chapters yet.",
    back: "Go back",
    added: "Started",
    demoBanner: "Demo Version: Stories live in your browser cache. Export them to keep them safe.",
    saveBackup: "Export Backup",
    inviteLink: "Invite family (Coming Soon)",
    backupDownloaded: "Backup file downloaded.",
    confirmDeleteTitle: "Delete this memory?",
    confirmDeleteBody: "This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Delete",
    copied: "Copied to clipboard",
    swipeHint: "Swipe to read",
    starterProgress: (current: number, total: number) => `Chapter ${current} of ${total}`,
    freeChapter: "The story continues",
    q1: "What’s the first memory that comes to mind when you think of them?",
    q2: "What’s something you want everyone to know about them?",
    q3: "What were they known for?",
    q4: "In one word, how would you describe this person?",
    q5: "What do you think mattered most to them?",
    qFree: "Write any story you want.",
    qKnownFor: (name: string) => `What is something |||${name}||| was known for?`,
    qDescribe: (name: string) => `In one word, how would you describe |||${name}|||?`,
    qFirstMemory: (name: string) => `What’s the first memory that comes to mind when you think of |||${name}|||?`,
    qEveryoneKnow: (name: string) => `What’s something you want everyone to know about |||${name}|||?`,
    qMatteredMost: (name: string) => `What do you think mattered most to |||${name}|||?`,
    starterComplete: "Starter questions complete. The rest of the book is yours to write.",
  },
  es: {
    welcomeTitle: "VitaMyStory",
    welcomeBody: "Un lugar sencillo para guardar las historias que importan.",
    savedDevice: "Las historias viven en este dispositivo.",
    demoNoteTitle: "Cómo funciona esta Demo",
    demoNoteBody: "Tus historias se guardan en tu navegador. Puedes exportar un respaldo cuando quieras para conservarlas.",
    whoFor: "¿Sobre quién escribiremos?",
    placeholder: "Abuela Elvia",
    justName: "Solo un nombre para empezar un capítulo.",
    continue: "Continuar",
    chooseExisting: "O elige a alguien más",
    introTitle: "Un santuario para recuerdos",
    introBody: (name: string) => 
      `VitaMyStory es el lugar donde aseguramos que el legado de |||${name}||| nunca se apague.\n\nNo hay prisa. Tómate tu tiempo. Captura una historia a la vez y compártela con tu familia.`,
    startWriting: "Comenzar a escribir",
    writeTitle: "Comparte un recuerdo",
    writeSubtitle: "Tómate tu tiempo. Unas pocas frases es perfecto.",
    writePlaceholder: "Empieza a escribir aquí...",
    saveStory: "Guardar recuerdo",
    updateStory: "Actualizar recuerdo",
    viewStories: "Leer historias",
    viewAllStories: (name: string) => `Leer todo sobre ${name}`,
    addAnother: "Escribir otra",
    invite: "Invitar familia", 
    inviteMsg: (name: string) => `Estoy guardando las historias de ${name} en VitaMyStory. Únete a mí.`,
    milestoneMsg: (name: string) => `¡Mira lo que hice con la historia de ${name}! Acabo de desbloquear la insignia de Guardián de Historias en VitaMyStory.`,
    shareMilestone: "Comparte este logro con tu familia",
    storySaved: "Recuerdo guardado.",
    storyShared: "Historia compartida",
    firstStorySaved: "Primer recuerdo guardado.",
    firstStorySavedPerson: (name: string) => `Tu primera historia sobre ${name} está segura.`,
    storySavedTitle: "Recuerdo guardado.",
    storySavedBody: "Este momento está seguro.",
    firstStoryTitle: "El primer capítulo comienza.",
    firstStoryBody: "Has iniciado un legado.",
    secondStoryTitle: "Dos historias guardadas.",
    secondStoryBody: "Vas muy bien. Completa 5 historias para desbloquear funciones especiales.",
    storyKeeperTitle: "Guardián de Historias",
    storyKeeperBody: (name: string) =>
      `Has completado el primer capítulo del legado de ${name}.`,
    storyKeeperBadge: "Guardián",
    storiesOf: "LAS HISTORIAS DE",
    storyOf: "LA HISTORIA DE",
    change: "Cambiar",
    emptyHome: "Una página en blanco esperando recuerdos. Empieza cuando quieras.",
    writeAStory: "Escribir historia",
    newPerson: "Nueva persona",
    resetApp: "Reiniciar app",
    choosePerson: "Elige una persona",
    noPeople: "No hay capítulos aún.",
    back: "Regresar",
    added: "Iniciado",
    demoBanner: "Versión Demo: Las historias viven en tu navegador. Expórtalas para guardarlas.",
    saveBackup: "Exportar Respaldo",
    inviteLink: "Invitar familia (Pronto)",
    backupDownloaded: "Archivo de respaldo descargado.",
    confirmDeleteTitle: "¿Borrar este recuerdo?",
    confirmDeleteBody: "Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    confirm: "Borrar",
    copied: "Copiado al portapapeles",
    swipeHint: "Desliza para leer",
    starterProgress: (current: number, total: number) => `Capítulo ${current} de ${total}`,
    freeChapter: "La historia continúa",
    q1: "¿Cuál es el primer recuerdo que te viene a la mente cuando piensas en ellos?",
    q2: "¿Qué es algo que quieres que todos sepan sobre ellos?",
    q3: "¿Por qué cosa eran conocidos?",
    q4: "En una palabra, ¿cómo describirías a esta persona?",
    q5: "¿Qué crees que era lo que más les importaba?",
    qFree: "Escribe cualquier historia que quieras.",
    qKnownFor: (name: string) => `¿Qué es algo por lo que |||${name}||| era conocido/a?`,
    qDescribe: (name: string) => `En una palabra, ¿cómo describirías a |||${name}|||?`,
    qFirstMemory: (name: string) => `¿Cuál es el primer recuerdo que te viene a la mente al pensar en |||${name}|||?`,
    qEveryoneKnow: (name: string) => `¿Qué es algo que quieres que todos sepan sobre |||${name}|||?`,
    qMatteredMost: (name: string) => `¿Qué crees que era lo que más le importaba a |||${name}|||?`,
    starterComplete: "Preguntas iniciales completas. El resto del libro es tuyo.",
  },
};

// --- DATA TYPES & STORAGE HELPERS ---
type LastSaved = {
  personName: string;
  prompt: string;
  text: string;
  createdAt: number;
  personId?: string;
};
type MemoryItem = {
  id: string;
  prompt: string;
  text: string;
  createdAt: number;
};
type Person = {
  id: string;
  name: string;
  memories: MemoryItem[];
  createdAt: number;
};
const LS = {
  people: "vms_people_v0",
  activePersonId: "vms_active_person_id_v0",
  questionState: "vms_weekly_question_state_v0",
  draftPrefix: "vms_draft_v0_",
  usedPrefix: "vms_used_questions_v0_",
  badgesPrefix: "vms_badges_v0_",
  lang: "vms_lang_v0",
};

// --- UTILS ---
function normalize(s: string): string { return (s ?? "").trim(); }
function makeId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function canUseStorage() {
  try { return typeof window !== "undefined" && !!window.localStorage; } catch { return false; }
}
function loadJSON<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try { const raw = window.localStorage.getItem(key); if (!raw) return null; return JSON.parse(raw) as T; } catch { return null; }
}
function saveJSON(key: string, value: unknown) {
  if (!canUseStorage()) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { }
}
function loadString(key: string): string {
  if (!canUseStorage()) return "";
  try { return window.localStorage.getItem(key) || ""; } catch { return ""; }
}
function saveString(key: string, value: string) {
  if (!canUseStorage()) return;
  try { window.localStorage.setItem(key, value); } catch { }
}
function removeKey(key: string) {
  if (!canUseStorage()) return;
  try { window.localStorage.removeItem(key); } catch { }
}
function currentWeekNumber() { return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)); }
function formatWhen(ts: number, lang: Lang) {
  try {
    const d = new Date(ts);
    const locale = lang === "es" ? "es-MX" : "en-US";
    return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  } catch { return ""; }
}
function addMemory(existing: MemoryItem[], prompt: string, text: string): MemoryItem[] {
  const p = normalize(prompt);
  const t = normalize(text);
  if (!t) return existing;
  return [...existing, { id: makeId(), prompt: p, text: t, createdAt: Date.now() }];
}
function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  const m = index % length;
  return m < 0 ? m + length : m;
}
function plural(n: number, one: string, many?: string) {
  if (n === 1) return one;
  if (many) return many;
  const lower = one.toLowerCase();
  if (lower.endsWith("story")) return "stories";
  if (lower.endsWith("historia")) return "historias";
  return `${one}s`;
}
function loadUsedQuestionIndexes(personId: string): number[] {
  if (!personId) return [];
  const key = `${LS.usedPrefix}${personId}`;
  const loaded = loadJSON<number[]>(key);
  return Array.isArray(loaded) ? loaded.map((n) => Math.floor(Number(n))).filter((n) => Number.isFinite(n) && n >= 0) : [];
}
function saveUsedQuestionIndexes(personId: string, used: number[]) {
  if (!personId) return;
  const key = `${LS.usedPrefix}${personId}`;
  const uniq = Array.from(new Set(used.map((n) => Math.floor(Number(n))))).filter((n) => Number.isFinite(n) && n >= 0);
  saveJSON(key, uniq);
}
function nextUnusedIndex(from: number, delta: number, length: number, usedSet: Set<number>) {
  if (length <= 0) return 0;
  for (let step = 1; step <= length; step++) {
    const candidate = wrapIndex(from + delta * step, length);
    if (!usedSet.has(candidate)) return candidate;
  }
  return from;
}
function loadBadges(personId: string): string[] {
  if (!personId) return [];
  const key = `${LS.badgesPrefix}${personId}`;
  const loaded = loadJSON<string[]>(key);
  return Array.isArray(loaded) ? loaded.map(String).filter(Boolean) : [];
}
function hasBadge(personId: string, badgeId: string) { return loadBadges(personId).includes(badgeId); }
function addBadge(personId: string, badgeId: string) {
  if (!personId || !badgeId) return;
  const current = loadBadges(personId);
  if (current.includes(badgeId)) return;
  saveJSON(`${LS.badgesPrefix}${personId}`, [...current, badgeId]);
}

function renderWithBoldName(text: string) {
  if (!text) return null;
  const parts = text.split("|||");
  if (parts.length === 1) return parts[0];
  if(parts.length < 3) return text;
  return <>{parts[0]}<span className="font-bold text-stone-900">{parts[1]}</span>{parts[2]}</>;
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-4 rounded-xl bg-stone-900 text-stone-50 font-sans font-medium tracking-wide shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-4 rounded-xl border border-stone-200 bg-white text-stone-600 font-sans font-medium shadow-sm active:scale-[0.98] transition-all hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50 disabled:bg-stone-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 40;
  const onTouchStart = (e: React.TouchEvent) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientX; };
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance) onSwipeLeft();
    if (distance < -minSwipeDistance) onSwipeRight();
  };
  return { onTouchStart, onTouchMove, onTouchEnd };
}

function ArrowButton({ direction, onClick, disabled }: { direction: "left" | "right", onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 text-stone-300 hover:text-stone-600 disabled:opacity-0 transition-colors hidden sm:block ${direction === "left" ? "-ml-2" : "-mr-2"}`}
    >
      <span className="text-2xl font-sans">{direction === "left" ? "←" : "→"}</span>
    </button>
  );
}

interface StoryCarouselProps {
    items: MemoryItem[];
    lang: Lang;
    onDelete: (id: string) => void;
    onEdit: (item: MemoryItem) => void;
}

function StoryCarousel({ items, lang, onDelete, onEdit }: StoryCarouselProps) {
  const [index, setIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const t = TEXT[lang];

  function prev() { setShowDeleteConfirm(false); setIndex((i) => (i === 0 ? items.length - 1 : i - 1)); }
  function next() { setShowDeleteConfirm(false); setIndex((i) => (i === items.length - 1 ? 0 : i + 1)); }
  const swipeHandlers = useSwipe(next, prev);

  useEffect(() => {
    if (items.length <= 0) return;
    setIndex((i) => Math.max(0, Math.min(i, items.length - 1)));
  }, [items.length]);

  const current = items[index];
  if (!current) return null;

  return (
    <div className="relative">
      <div 
        {...swipeHandlers}
        className="bg-white border border-stone-200 shadow-sm rounded-xl min-h-[380px] flex flex-col relative touch-pan-y overflow-hidden transition-all"
      >
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 font-sans">
            <h3 className="text-xl font-bold text-stone-900 mb-2">{t.confirmDeleteTitle}</h3>
            <p className="text-sm text-stone-500 mb-6 text-center">{t.confirmDeleteBody}</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-stone-100 rounded-lg text-stone-600 font-medium hover:bg-stone-200 transition-colors">{t.cancel}</button>
              <button onClick={() => { onDelete(current.id); setShowDeleteConfirm(false); }} className="flex-1 py-3 bg-red-50 rounded-lg text-red-600 font-medium hover:bg-red-100 transition-colors">{t.confirm}</button>
            </div>
          </div>
        )}

        <div className="bg-stone-100 w-full px-6 py-8 flex flex-col items-center space-y-4 border-b border-stone-200 relative">
             <div className="absolute top-4 right-4 flex gap-3 text-stone-400">
                <button onClick={(e) => { e.stopPropagation(); onEdit(current); }} className="hover:text-stone-600 transition-colors p-1" title="Edit memory">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="hover:text-red-400 transition-colors p-1" title="Delete memory">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
             </div>
             <div className="text-[10px] font-bold text-stone-400 tracking-[0.2em] uppercase font-sans">
                {formatWhen(current.createdAt, lang)}
            </div>
            {current.prompt ? (
                // UPDATED: Increased text size for prompt
                <div className="text-lg text-stone-500 italic font-medium text-center px-4 leading-relaxed max-w-sm font-serif">
                  {renderWithBoldName(current.prompt)}
                </div>
            ) : null}
        </div>

        <div className="flex-1 bg-white p-8 flex flex-col justify-center items-center w-full overflow-hidden">
          {/* UPDATED: Hidden scrollbar utility class added */}
          <div className="text-2xl sm:text-3xl text-stone-800 leading-normal text-center font-serif px-2 w-full break-words overflow-y-auto max-h-[300px] no-scrollbar">
            {current.text}
          </div>
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {items.map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${i === index ? "bg-stone-400 scale-110" : "bg-stone-200"}`} />
            ))}
          </div>
        )}
      </div>
      <div className="absolute -left-5 top-1/2 -translate-y-1/2 z-20"><ArrowButton direction="left" onClick={prev} disabled={false} /></div>
      <div className="absolute -right-5 top-1/2 -translate-y-1/2 z-20"><ArrowButton direction="right" onClick={next} disabled={false} /></div>
    </div>
  );
}

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
  const suppressAutoSelectRef = useRef(false);
  const autosaveTimer = useRef<number | null>(null);
  const [usedVersion, setUsedVersion] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null);
  const [toast, setToast] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string>("");

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

  function goPrevQuestion() { if (allStarterUsed) return; setQuestionIndex((i) => nextUnusedIndex(i, -1, QUESTIONS.length, usedSet)); }
  function goNextQuestion() { if (allStarterUsed) return; setQuestionIndex((i) => nextUnusedIndex(i, 1, QUESTIONS.length, usedSet)); }
  const questionSwipeHandlers = useSwipe(goNextQuestion, goPrevQuestion);
  const storySwipeHandlers = useSwipe(() => {}, () => {}); 

  function startNewPerson() { suppressAutoSelectRef.current = true; setActivePersonId(""); setNameDraft(""); setStoryDraft(""); setEditingId(null); setEditingPrompt(""); setStep("WELCOME"); }
  function deleteMemory(memoryId: string) { if (!activePersonId) return; setPeople((prev) => prev.map((p) => { if (p.id !== activePersonId) return p; return { ...p, memories: p.memories.filter((m) => m.id !== memoryId) }; })); }
  function startEditing(item: MemoryItem) { setEditingId(item.id); setEditingPrompt(item.prompt); setStoryDraft(item.text); setStep("WRITE"); }
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
    suppressAutoSelectRef.current = true; setPeople([]); setActivePersonId(""); setNameDraft(""); setStoryDraft(""); setLastSaved(null); setToast(""); setEditingId(null); setEditingPrompt(""); setStep("WELCOME"); setUsedVersion((v) => v + 1); setBadgeVersion((v) => v + 1);
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
        setPeople((prev) => prev.map((p) => (p.id !== activePerson.id ? p : { ...p, memories: p.memories.map((m) => m.id === editingId ? { ...m, text: text } : m) })));
        setLastSaved({ personName: activePerson.name, prompt: editingPrompt, text: text, createdAt: Date.now(), personId: activePerson.id });
        setEditingId(null); setEditingPrompt(""); setStoryDraft(""); setStep("SAVED"); return;
    }
    if (activePerson) {
      const willCompleteStarter = !allStarterUsed && usedSet.size === QUESTIONS.length - 1;
      markCurrentQuestionUsed(activePerson.id);
      setPeople((prev) => prev.map((p) => p.id === activePerson.id ? { ...p, memories: addMemory(p.memories, promptToSave, storyDraft) } : p));
      setLastSaved({ personName: displayName || activePerson.name, prompt: promptToSave, text: storyDraft, createdAt: Date.now(), personId: activePerson.id });
      removeKey(`${LS.draftPrefix}${activePerson.id}`); setStoryDraft(""); advanceToNextUnused(activePerson.id);
      if (willCompleteStarter) { maybeAwardStoryKeeper(activePerson.id); setStep("BADGE"); return; }
      setStep("SAVED"); return;
    }
    const cleaned = normalize(nameDraft); if (!cleaned) return;
    const p: Person = { id: makeId(), name: cleaned, memories: addMemory([], promptToSave, storyDraft), createdAt: Date.now() };
    setPeople((prev) => [p, ...prev]); setActivePersonId(p.id); saveUsedQuestionIndexes(p.id, [wrapIndex(questionIndex, QUESTIONS.length)]); setUsedVersion((v) => v + 1);
    setLastSaved({ personName: cleaned, prompt: promptToSave, text: storyDraft, createdAt: Date.now(), personId: p.id });
    removeKey(`${LS.draftPrefix}${p.id}`); setNameDraft(""); setStoryDraft(""); advanceToNextUnused(p.id); setStep("SAVED");
  }

  const canSave = normalize(storyDraft).length > 0 && normalize(displayName).length > 0;
  const savedCount = activePerson ? activePerson.memories.length : lastSaved ? 1 : 0;

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
        
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden relative border border-stone-100 min-h-[500px] flex flex-col">
          <div className="p-8 flex-1 flex flex-col">
            {toast ? <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2 rounded-full text-sm font-sans font-medium shadow-lg animate-fade-in z-50">{toast}</div> : null}

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
                   <h2 className="text-xl font-serif font-bold leading-relaxed text-stone-800">{renderWithBoldName(displayQuestion.text)}</h2>
                </div>
                <div className="flex-1 relative mb-6">
                    <div className="absolute inset-0 bg-stone-50 rounded-xl border border-stone-200 shadow-inner"></div>
                    <textarea value={storyDraft} onChange={(e) => setStoryDraft(e.target.value)} placeholder={t.writePlaceholder} className="relative w-full h-full resize-none bg-transparent p-6 text-xl font-serif leading-relaxed text-stone-800 placeholder:font-sans placeholder:text-stone-400 focus:outline-none z-10" />
                    {!editingId && (<><div className="absolute -left-5 top-1/2 -translate-y-1/2 z-20"><ArrowButton direction="left" onClick={goPrevQuestion} disabled={allStarterUsed} /></div><div className="absolute -right-5 top-1/2 -translate-y-1/2 z-20"><ArrowButton direction="right" onClick={goNextQuestion} disabled={allStarterUsed} /></div></>)}
                </div>
                <div className="space-y-4">
                  <PrimaryButton disabled={!canSave} onClick={saveStory}>{editingId ? t.updateStory : t.saveStory}</PrimaryButton>
                  {people.length > 0 && (<div className="text-center"><button onClick={() => { if(editingId) { setEditingId(null); setEditingPrompt(""); setStoryDraft(""); } setStep("HOME") }} className="text-sm text-stone-400 hover:text-stone-600 font-sans">{editingId ? "Cancel editing" : t.viewStories}</button></div>)}
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
                  {/* UPDATED: Bigger Book Icon */}
                  <div className="text-8xl animate-bounce">📖</div>
                  {/* UPDATED: Sans Serif for Badge Title */}
                  <h2 className="text-3xl font-sans font-bold text-stone-900">{t.storyKeeperTitle}</h2>
                  <p className="text-stone-500 font-sans">{t.storyKeeperBody(displayName)}</p>
                </div>
                <div className="space-y-3">
                    <PrimaryButton onClick={() => setStep("WRITE")}>{t.addAnother}</PrimaryButton>
                    <SecondaryButton onClick={() => setStep("HOME")}>{t.viewStories}</SecondaryButton>
                </div>
                {/* UPDATED: Share Milestone Link */}
                <div className="text-center pt-2">
                    <button onClick={shareMilestone} className="text-xs text-stone-400 hover:text-stone-600 underline font-sans tracking-wide">
                        {t.shareMilestone}
                    </button>
                </div>
              </div>
            )}

            {step === "HOME" && (
              <div {...storySwipeHandlers} className="flex-1 flex flex-col animate-in fade-in duration-500 touch-pan-y">
                <div className="mb-6 text-left pl-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 font-sans">{activeMemories.length === 1 ? t.storyOf : t.storiesOf}</div>
                    {storyKeeperEarned && (<div className="text-xs text-stone-900 font-bold tracking-widest uppercase flex items-center gap-1 font-sans"><span className="text-base">📖</span> {t.storyKeeperBadge}</div>)}
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
                      <button key={p.id} onClick={() => { setActivePersonId(p.id); setStep("HOME"); }} className={`w-full text-left p-5 rounded-xl transition-all ${ p.id === activePersonId ? "bg-stone-900 text-white shadow-md" : "bg-stone-50 text-stone-600 hover:bg-stone-100" }`}>
                        <div className="text-xl font-serif leading-none mb-2">{p.name}</div>
                        <div className={`text-xs uppercase tracking-wider font-sans ${p.id === activePersonId ? "text-stone-400" : "text-stone-400"}`}>{p.memories.length} {plural(p.memories.length, "story", lang === "es" ? "historias" : "stories")}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className="pt-6 space-y-3"><PrimaryButton onClick={startNewPerson}>{t.newPerson}</PrimaryButton><button onClick={() => setStep("HOME")} className="w-full py-3 text-sm text-stone-400 hover:text-stone-600 font-sans">{t.back}</button></div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center py-6 space-y-2"><button onClick={resetApp} className="text-[10px] uppercase tracking-widest text-stone-300 hover:text-stone-500 transition-colors font-sans">{t.resetApp}</button></div>
      </div>
    </div>
  );
}
