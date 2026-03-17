"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMemory } from "../context/MemoryContext";

const SESSION_KEY = "vms_memory_flash_shown";
const MIN_STORIES = 3;
const AUTO_DISMISS_MS = 7000;

/**
 * MemoryFlash — surfaces a random past memory each time the user opens the app.
 * Rules:
 *  - Only shows if the active person has 3+ stories
 *  - Shows once per browser session (sessionStorage flag)
 *  - Auto-dismisses after 7 seconds
 *  - Never shows to users with fewer than MIN_STORIES stories
 */
export function MemoryFlash() {
  const { activeMemories, activePerson, lang } = useMemory();
  const router = useRouter();
  const [memory, setMemory] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (activeMemories.length < MIN_STORIES) return;

    // Pick a random memory that has text (skip pure audio/photo-only)
    const textMemories = activeMemories.filter((m) => m.text && m.text.trim().length > 10);
    if (textMemories.length === 0) return;

    const pick = textMemories[Math.floor(Math.random() * textMemories.length)];
    sessionStorage.setItem(SESSION_KEY, "1");

    // Delay slightly so the page renders first
    const showTimer = setTimeout(() => {
      setMemory(pick);
      setVisible(true);
    }, 1200);

    return () => clearTimeout(showTimer);
  }, [activeMemories]);

  // Auto-dismiss
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible]);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      setMemory(null);
    }, 400);
  }, []);

  const handleRead = useCallback(() => {
    dismiss();
    router.push("/stories");
  }, [dismiss, router]);

  if (!memory || !visible) return null;

  const preview = memory.text.length > 100
    ? memory.text.slice(0, 100).trim() + "…"
    : memory.text;

  const label = lang === "es" ? "Un recuerdo tuyo" : "A memory from your collection";
  const readLabel = lang === "es" ? "Leer →" : "Read →";
  const closeLabel = lang === "es" ? "Cerrar" : "Dismiss";

  return (
    <div
      className={`fixed bottom-20 inset-x-0 z-40 px-4 pointer-events-none transition-all duration-400 ${
        exiting
          ? "opacity-0 translate-y-6"
          : "opacity-100 translate-y-0"
      }`}
      style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}
    >
      <div className="max-w-lg mx-auto pointer-events-auto">
        {/* Card */}
        <div
          className="bg-white dark:bg-midnight-900 rounded-3xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden"
          style={{
            animation: exiting ? "none" : "slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          {/* Progress bar — counts down AUTO_DISMISS_MS */}
          <div className="h-0.5 bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full bg-stone-300 dark:bg-stone-600 origin-left"
              style={{
                animation: `shrink ${AUTO_DISMISS_MS}ms linear both`,
              }}
            />
          </div>

          <div className="px-5 py-4">
            {/* Label */}
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 mb-2 font-sans">
              {activePerson ? `${label} · ${activePerson.name}` : label}
            </p>

            {/* Memory text */}
            <p className="font-serif text-base leading-relaxed text-stone-800 dark:text-stone-200 mb-4">
              "{preview}"
            </p>

            {/* Prompt (if it exists) */}
            {memory.prompt && (
              <p className="text-xs text-stone-400 dark:text-stone-600 italic mb-3 truncate">
                {memory.prompt}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleRead}
                className="text-sm font-semibold text-stone-900 dark:text-stone-100 hover:opacity-70 transition-opacity font-sans"
              >
                {readLabel}
              </button>
              <button
                onClick={dismiss}
                className="text-xs text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors font-sans"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
