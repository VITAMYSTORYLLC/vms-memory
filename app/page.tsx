"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Step = "WELCOME" | "WRITE" | "SAVED" | "BADGE" | "HOME" | "PEOPLE";

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
  questionState: "vms_weekly_question_state_v0", // { week, index }
  draftPrefix: "vms_draft_v0_", // + personId
  usedPrefix: "vms_used_questions_v0_", // + personId -> number[]
  badgesPrefix: "vms_badges_v0_", // + personId -> string[]
};

function normalize(s: string): string {
  return (s ?? "").trim();
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canUseStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function loadJSON<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveJSON(key: string, value: unknown) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function loadString(key: string): string {
  if (!canUseStorage()) return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function saveString(key: string, value: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeKey(key: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function currentWeekNumber() {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
}

function formatWhen(ts: number) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
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
  const endsWithY = lower.endsWith("y");
  const prev = lower.length >= 2 ? lower[lower.length - 2] : "";
  const isVowel = "aeiou".includes(prev);
  if (endsWithY && !isVowel) return `${one.slice(0, -1)}ies`;

  return `${one}s`;
}

function savedHeroText(savedCount: number, name?: string) {
  const n = normalize(name || "");
  if (savedCount === 1 && n) return `Your first story about ${n} has been saved.`;
  if (savedCount === 1) return "Your first story has been saved.";
  return "Story saved.";
}

function loadUsedQuestionIndexes(personId: string): number[] {
  if (!personId) return [];
  const key = `${LS.usedPrefix}${personId}`;
  const loaded = loadJSON<number[]>(key);
  return Array.isArray(loaded)
    ? loaded
        .map((n) => Math.floor(Number(n)))
        .filter((n) => Number.isFinite(n) && n >= 0)
    : [];
}

function saveUsedQuestionIndexes(personId: string, used: number[]) {
  if (!personId) return;
  const key = `${LS.usedPrefix}${personId}`;
  const uniq = Array.from(new Set(used.map((n) => Math.floor(Number(n))))).filter(
    (n) => Number.isFinite(n) && n >= 0
  );
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

function hasBadge(personId: string, badgeId: string) {
  return loadBadges(personId).includes(badgeId);
}

function addBadge(personId: string, badgeId: string) {
  if (!personId || !badgeId) return;
  const current = loadBadges(personId);
  if (current.includes(badgeId)) return;
  saveJSON(`${LS.badgesPrefix}${personId}`, [...current, badgeId]);
}

function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-3 rounded-xl bg-neutral-900 text-white disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-3 rounded-xl border disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function StoryCarousel({ items }: { items: MemoryItem[] }) {
  const [index, setIndex] = useState(0);

  function prev() {
    setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === items.length - 1 ? 0 : i + 1));
  }

  useEffect(() => {
    if (items.length <= 0) return;
    setIndex((i) => Math.max(0, Math.min(i, items.length - 1)));
  }, [items.length]);

  const current = items[index];
  if (!current) return null;

  return (
    <div className="border rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          aria-label="Previous story"
          className="h-8 w-8 rounded-full border text-neutral-500 hover:bg-neutral-50"
        >
          &lt;
        </button>

        <div className="text-xs text-neutral-500">{formatWhen(current.createdAt)}</div>

        <button
          onClick={next}
          aria-label="Next story"
          className="h-8 w-8 rounded-full border text-neutral-500 hover:bg-neutral-50"
        >
          &gt;
        </button>
      </div>

      {current.prompt ? (
        <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600 italic text-center">
          {current.prompt}
        </div>
      ) : null}

      <div className="text-base text-neutral-900 leading-relaxed text-center">{current.text}</div>
    </div>
  );
}

function runSmokeTests() {
  console.assert(plural(1, "story") === "story", "plural 1 story");
  console.assert(plural(2, "story") === "stories", "plural 2 stories");
  console.assert(plural(0, "story") === "stories", "plural 0 stories");
  console.assert(plural(2, "memory") === "memories", "plural 2 memories");
  console.assert(plural(2, "day") === "days", "plural 2 days");
  console.assert(wrapIndex(-1, 5) === 4, "wrapIndex negative");
  console.assert(wrapIndex(5, 5) === 0, "wrapIndex exact");
  console.assert(nextUnusedIndex(0, 1, 5, new Set([0, 1, 2])) === 3, "nextUnusedIndex next");
  console.assert(nextUnusedIndex(4, 1, 5, new Set([0, 1, 2])) === 3, "nextUnusedIndex wraps");
}

try {
  const isProd =
    typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    process.env.NODE_ENV === "production";
  if (!isProd) runSmokeTests();
} catch {
  // ignore
}

export default function Page() {
  const QUESTIONS = useMemo(
    () => [
      "What’s the first memory or story that comes to mind when you think of them?",
      "What’s something you want everyone to know about them?",
      "What’s something they were known for?",
      "In one word, how would you describe this person?",
      "What do you think mattered most to them?",
    ],
    []
  );

  // --- FIXED: Initialize with safe defaults for Server/Client consistency ---
  const [isHydrated, setIsHydrated] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [activePersonId, setActivePersonId] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [step, setStep] = useState<Step>("WELCOME");
  // -------------------------------------------------------------------------

  const [nameDraft, setNameDraft] = useState("");
  const [storyDraft, setStoryDraft] = useState("");

  const suppressAutoSelectRef = useRef(false);
  const autosaveTimer = useRef<number | null>(null);

  const [usedVersion, setUsedVersion] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);

  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null);
  const [toast, setToast] = useState<string>("");

  // --- FIXED: Load data once after mount to avoid Hydration Mismatch ---
  useEffect(() => {
    // 1. Load People
    const loadedPeople = loadJSON<Person[]>(LS.people);
    const validPeople = Array.isArray(loadedPeople) ? loadedPeople : [];
    setPeople(validPeople);

    // 2. Load Active ID
    const loadedActiveId = loadString(LS.activePersonId);
    setActivePersonId(loadedActiveId);

    // 3. Load Question State
    const week = currentWeekNumber();
    const storedQ = loadJSON<{ week: number; index: number }>(LS.questionState);
    if (
      storedQ &&
      typeof storedQ.week === "number" &&
      typeof storedQ.index === "number" &&
      storedQ.week === week
    ) {
      setQuestionIndex(storedQ.index % QUESTIONS.length);
    } else {
      setQuestionIndex(week % QUESTIONS.length);
    }

    // 4. Determine Start Step
    if (validPeople.length > 0) {
      setStep("HOME");
    } else {
      setStep("WELCOME");
    }

    // 5. Allow saving now that data is loaded
    setIsHydrated(true);
  }, [QUESTIONS.length]);
  // ---------------------------------------------------------------------

  useEffect(() => {
    if (people.length === 0) {
      if (isHydrated) setActivePersonId("");
      return;
    }

    if (suppressAutoSelectRef.current) {
      suppressAutoSelectRef.current = false;
      return;
    }

    if (!activePersonId || !people.some((p) => p.id === activePersonId)) {
      setActivePersonId(people[0].id);
    }
  }, [people, activePersonId, isHydrated]);

  const activePerson = useMemo(
    () => people.find((p) => p.id === activePersonId) || null,
    [people, activePersonId]
  );

  const safeName = useMemo(() => normalize(activePerson?.name || ""), [activePerson?.name]);
  const displayName = safeName || normalize(nameDraft);
  const activeMemories = activePerson?.memories ?? [];

  const usedSet = useMemo(() => {
    const pid = activePersonId || "";
    return new Set<number>(loadUsedQuestionIndexes(pid));
  }, [activePersonId, usedVersion]);

  const storyKeeperEarned = useMemo(() => {
    const pid = activePersonId || "";
    if (!pid) return false;
    return hasBadge(pid, "story_keeper");
  }, [activePersonId, badgeVersion]);

  const allStarterUsed = usedSet.size >= QUESTIONS.length && QUESTIONS.length > 0;

  const currentQuestion = useMemo(
    () => QUESTIONS[wrapIndex(questionIndex, QUESTIONS.length)] || QUESTIONS[0],
    [questionIndex, QUESTIONS]
  );

  const displayQuestion = useMemo(() => {
    if (allStarterUsed) return { type: "free" as const, text: "Write any story you want." };

    const q = currentQuestion;
    const name = displayName;

    if (q.toLowerCase().includes("known for") && name) {
      return { type: "knownFor" as const, text: `What’s something ${name} was known for?` };
    }

    return { type: "plain" as const, text: q };
  }, [allStarterUsed, currentQuestion, displayName]);

  const promptToSave = useMemo(() => {
    if (allStarterUsed) return "";
    return displayQuestion.text;
  }, [allStarterUsed, displayQuestion.text]);

  const usedCount = usedSet.size;
  const starterTotal = QUESTIONS.length;
  const starterProgressIndex = useMemo(() => {
    const x = Math.min(starterTotal, Math.max(1, usedCount + 1));
    return x;
  }, [starterTotal, usedCount]);

  const starterProgressPct = useMemo(() => {
    if (starterTotal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((usedCount / starterTotal) * 100)));
  }, [starterTotal, usedCount]);

  // --- FIXED: Only save when hydrated to prevent overwriting data with defaults ---
  useEffect(() => {
    if (isHydrated) saveJSON(LS.people, people);
  }, [people, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveString(LS.activePersonId, activePersonId);
  }, [activePersonId, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      const week = currentWeekNumber();
      saveJSON(LS.questionState, { week, index: questionIndex });
    }
  }, [questionIndex, isHydrated]);
  // ------------------------------------------------------------------------------

  useEffect(() => {
    const tick = () => {
      const week = currentWeekNumber();
      const stored = loadJSON<{ week: number; index: number }>(LS.questionState);
      if (stored && stored.week === week) return;
      setQuestionIndex(week % QUESTIONS.length);
    };

    tick();
    if (typeof window === "undefined") return;
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [QUESTIONS.length]);

  function showToast(msg: string) {
    setToast(msg);
    if (typeof window === "undefined") return;
    window.setTimeout(() => setToast(""), 2200);
  }

  useEffect(() => {
    if (!activePersonId) return;
    const key = `${LS.draftPrefix}${activePersonId}`;
    const saved = loadString(key);
    if (saved && !normalize(storyDraft)) setStoryDraft(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersonId]);

  useEffect(() => {
    if (!activePersonId) return;
    if (typeof window === "undefined") return;

    const key = `${LS.draftPrefix}${activePersonId}`;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

    autosaveTimer.current = window.setTimeout(() => {
      const val = storyDraft;
      if (!normalize(val)) removeKey(key);
      else saveString(key, val);
    }, 350);

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [storyDraft, activePersonId]);

  function goPrevQuestion() {
    if (allStarterUsed) return;
    setQuestionIndex((i) => nextUnusedIndex(i, -1, QUESTIONS.length, usedSet));
  }

  function goNextQuestion() {
    if (allStarterUsed) return;
    setQuestionIndex((i) => nextUnusedIndex(i, 1, QUESTIONS.length, usedSet));
  }

  function startNewPerson() {
    suppressAutoSelectRef.current = true;
    setActivePersonId("");
    setNameDraft("");
    setStoryDraft("");
    setStep("WELCOME");
  }

  function resetApp() {
    if (!canUseStorage()) {
      setPeople([]);
      setActivePersonId("");
      setNameDraft("");
      setStoryDraft("");
      setLastSaved(null);
      setToast("");
      setStep("WELCOME");
      return;
    }

    try {
      window.localStorage.removeItem(LS.people);
      window.localStorage.removeItem(LS.activePersonId);
      window.localStorage.removeItem(LS.questionState);

      const prefixes = [LS.draftPrefix, LS.usedPrefix, LS.badgesPrefix];
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (prefixes.some((p) => k.startsWith(p))) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // ignore
    }

    suppressAutoSelectRef.current = true;
    setPeople([]);
    setActivePersonId("");
    setNameDraft("");
    setStoryDraft("");
    setLastSaved(null);
    setToast("");
    setStep("WELCOME");
    setUsedVersion((v) => v + 1);
    setBadgeVersion((v) => v + 1);
  }

  function inviteOthersComingSoon() {
    showToast("Invites are coming soon. For now, stories are saved on this device.");
  }

  function markCurrentQuestionUsed(personId: string) {
    if (!personId || allStarterUsed) return;
    const idx = wrapIndex(questionIndex, QUESTIONS.length);
    const used = loadUsedQuestionIndexes(personId);
    saveUsedQuestionIndexes(personId, [...used, idx]);
    setUsedVersion((v) => v + 1);
  }

  function maybeAwardStoryKeeper(personId: string) {
    if (!personId) return false;
    const used = loadUsedQuestionIndexes(personId);
    const completed = used.length >= QUESTIONS.length;
    if (!completed) return false;
    if (hasBadge(personId, "story_keeper")) return false;
    addBadge(personId, "story_keeper");
    setBadgeVersion((v) => v + 1);
    return true;
  }

  function advanceToNextUnused(personId: string) {
    if (!personId) return;
    const usedNext = new Set<number>(loadUsedQuestionIndexes(personId));
    if (usedNext.size >= QUESTIONS.length) return;
    const nextIdx = nextUnusedIndex(questionIndex, 1, QUESTIONS.length, usedNext);
    setQuestionIndex(nextIdx);
  }

  function renderQuestionWithName(q: string, name: string) {
    const lower = q.toLowerCase();
    if (lower.includes("known for")) {
      return (
        <>
          What’s something <span className="font-semibold">{name}</span> was known for?
        </>
      );
    }
    if (lower.includes("describe")) {
      return (
        <>
          In one word, how would you describe <span className="font-semibold">{name}</span>?
        </>
      );
    }
    if (lower.includes("first memory")) {
      return (
        <>
          What’s the first memory or story that comes to mind when you think of{" "}
          <span className="font-semibold">{name}</span>?
        </>
      );
    }
    if (lower.includes("everyone to know")) {
      return (
        <>
          What’s something you want everyone to know about{" "}
          <span className="font-semibold">{name}</span>?
        </>
      );
    }
    if (lower.includes("mattered most")) {
      return (
        <>
          What do you think mattered most to <span className="font-semibold">{name}</span>?
        </>
      );
    }

    return q;
  }

  function saveStory() {
    const text = normalize(storyDraft);
    if (!text) return;

    if (activePerson) {
      const willCompleteStarter = !allStarterUsed && usedSet.size === QUESTIONS.length - 1;

      markCurrentQuestionUsed(activePerson.id);

      setPeople((prev) =>
        prev.map((p) =>
          p.id === activePerson.id
            ? { ...p, memories: addMemory(p.memories, promptToSave, storyDraft) }
            : p
        )
      );

      setLastSaved({
        personName: displayName || activePerson.name,
        prompt: promptToSave,
        text: storyDraft,
        createdAt: Date.now(),
        personId: activePerson.id,
      });

      removeKey(`${LS.draftPrefix}${activePerson.id}`);
      setStoryDraft("");

      advanceToNextUnused(activePerson.id);

      if (willCompleteStarter) {
        maybeAwardStoryKeeper(activePerson.id);
        setStep("BADGE");
        return;
      }

      setStep("SAVED");
      return;
    }

    const cleaned = normalize(nameDraft);
    if (!cleaned) return;

    const p: Person = {
      id: makeId(),
      name: cleaned,
      memories: addMemory([], promptToSave, storyDraft),
      createdAt: Date.now(),
    };

    setPeople((prev) => [p, ...prev]);
    setActivePersonId(p.id);

    saveUsedQuestionIndexes(p.id, [wrapIndex(questionIndex, QUESTIONS.length)]);
    setUsedVersion((v) => v + 1);

    setLastSaved({
      personName: cleaned,
      prompt: promptToSave,
      text: storyDraft,
      createdAt: Date.now(),
      personId: p.id,
    });

    removeKey(`${LS.draftPrefix}${p.id}`);
    setNameDraft("");
    setStoryDraft("");

    advanceToNextUnused(p.id);
    setStep("SAVED");
  }

  const canSave = normalize(storyDraft).length > 0 && normalize(displayName).length > 0;
  const savedCount = activePerson ? activePerson.memories.length : lastSaved ? 1 : 0;

  // Render a loading state until hydrated to prevent flash of wrong content
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900">
        {/* Optional: Add a spinner here if you want */}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            {toast ? (
              <div className="mb-4 rounded-xl border bg-white px-4 py-3 text-sm text-neutral-800">
                {toast}
              </div>
            ) : null}

            {step === "WELCOME" && (
              <div className="space-y-6 text-center">
                <h1 className="text-2xl font-semibold">Welcome to VMS</h1>
                <p className="text-neutral-600">
                  A simple place to collect stories and memories about the people who matter to you.
                </p>

                <div className="text-sm text-neutral-500">Saved on this device for now.</div>

                <div className="border rounded-2xl p-4 space-y-3">
                  <h2 className="text-lg font-semibold">Who is this for?</h2>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Grandma Elvia"
                    className="w-full border rounded-xl p-3 text-center text-lg"
                  />
                  <p className="text-xs text-neutral-500">Just a name to get started.</p>
                </div>

                <PrimaryButton disabled={!normalize(nameDraft)} onClick={() => setStep("WRITE")}>
                  Continue
                </PrimaryButton>

                {people.length > 0 ? (
                  <SecondaryButton onClick={() => setStep("PEOPLE")}>
                    Choose existing person
                  </SecondaryButton>
                ) : null}
              </div>
            )}

            {step === "WRITE" && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold">Share the stories here</h2>
                  <p className="text-sm text-neutral-500">Take your time. A few sentences is perfect.</p>
                </div>

                <div className="border rounded-2xl p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={goPrevQuestion}
                      aria-label="Previous question"
                      disabled={allStarterUsed}
                      className="mt-1 h-9 w-9 shrink-0 rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center disabled:opacity-40"
                    >
                      &lt;
                    </button>

                    <div className="flex-1">
                      <p className="text-neutral-900 text-lg leading-relaxed text-center">
                        {allStarterUsed
                          ? "Write any story you want."
                          : renderQuestionWithName(displayQuestion.text, displayName)}
                      </p>

                      {!allStarterUsed ? (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-neutral-500 text-center">
                            Starter question {starterProgressIndex} of {starterTotal}
                          </div>
                          <div className="h-2 w-full rounded-full bg-white border overflow-hidden">
                            <div className="h-full bg-neutral-900" style={{ width: `${starterProgressPct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-500 text-center">
                          Starter questions complete. Now write any story — big or small.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={goNextQuestion}
                      aria-label="Next question"
                      disabled={allStarterUsed}
                      className="mt-1 h-9 w-9 shrink-0 rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center disabled:opacity-40"
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="mt-4">
                    <textarea
                      value={storyDraft}
                      onChange={(e) => setStoryDraft(e.target.value)}
                      rows={6}
                      placeholder="A few sentences is perfect"
                      className="w-full border rounded-xl p-3 bg-white text-center"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <PrimaryButton disabled={!canSave} onClick={saveStory}>
                    Save story
                  </PrimaryButton>

                  {people.length > 0 ? (
                    <SecondaryButton onClick={() => setStep("HOME")}>View stories</SecondaryButton>
                  ) : null}
                </div>
              </div>
            )}

            {step === "SAVED" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">{savedHeroText(savedCount, displayName)}</h2>
                </div>

                <div className="space-y-3">
                  <PrimaryButton onClick={() => setStep("WRITE")}>Add another story</PrimaryButton>
                  <SecondaryButton onClick={inviteOthersComingSoon}>Invite family (soon)</SecondaryButton>
                  <SecondaryButton onClick={() => setStep("HOME")}>View all stories</SecondaryButton>
                </div>
              </div>
            )}

            {step === "BADGE" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-4xl">📖</div>
                  <h2 className="text-2xl font-semibold">Story Keeper</h2>
                  <p className="text-sm text-neutral-600">
                    You completed the first chapter of <span className="font-semibold">{displayName}</span>’s stories.
                  </p>
                </div>

                <div className="space-y-3">
                  <PrimaryButton onClick={() => setStep("WRITE")}>Add another story</PrimaryButton>
                  <SecondaryButton onClick={() => setStep("HOME")}>View stories</SecondaryButton>
                </div>

                <div className="text-[11px] text-neutral-500 text-center">This badge stays with this person.</div>
              </div>
            )}

            {step === "HOME" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    {activeMemories.length === 1 ? "Story of" : "Stories of"}
                  </div>

                  <div className="text-center text-3xl sm:text-4xl font-semibold italic font-['Caveat',cursive]">
                    {safeName}
                  </div>

                  {people.length > 1 ? (
                    <div className="text-center">
                      <button onClick={() => setStep("PEOPLE")} className="text-sm text-neutral-600 underline">
                        Change
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {activeMemories.length === 0 ? (
                    <div className="border rounded-2xl p-4 text-sm text-neutral-600 text-center">
                      This is where stories about this person will live. Start whenever you’re ready.
                    </div>
                  ) : (
                    <StoryCarousel items={[...activeMemories].reverse()} />
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 text-sm text-neutral-500">
                  <span>
                    {activeMemories.length} {plural(activeMemories.length, "story")}
                  </span>
                  {storyKeeperEarned ? (
                    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-700 bg-white">
                      <span aria-hidden>📖</span>
                      <span>Story Keeper</span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-2">
                  <PrimaryButton onClick={() => setStep("WRITE")}>Write a story</PrimaryButton>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <SecondaryButton onClick={startNewPerson}>New person</SecondaryButton>
                  <SecondaryButton onClick={inviteOthersComingSoon}>Invite family (soon)</SecondaryButton>
                </div>

                <div className="pt-2 flex justify-center">
                  <button type="button" onClick={resetApp} className="text-xs text-neutral-500 underline">
                    Reset app
                  </button>
                </div>

                <div className="text-[11px] text-neutral-400 text-center">Saved on this device for now.</div>
              </div>
            )}

            {step === "PEOPLE" && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-center">Choose a person</h2>

                {people.length === 0 ? (
                  <div className="border rounded-2xl p-4 text-sm text-neutral-600 text-center">
                    No one yet. Add a name to start.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {people.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePersonId(p.id);
                          setStep("HOME");
                        }}
                        className={`w-full text-left border rounded-2xl p-4 hover:bg-neutral-50 transition ${
                          p.id === activePersonId ? "border-neutral-900" : ""
                        }`}
                      >
                        <div className="text-lg font-serif italic">{p.name}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {p.memories.length} {plural(p.memories.length, "story")} • added {formatWhen(p.createdAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <SecondaryButton onClick={() => setStep("HOME")}>Back</SecondaryButton>
                  <PrimaryButton onClick={startNewPerson}>Add new person</PrimaryButton>
                </div>

                <div className="text-[11px] text-neutral-400 text-center">Saved on this device for now.</div>
              </div>
            )}
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
