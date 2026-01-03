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
