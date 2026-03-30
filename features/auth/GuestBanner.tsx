"use client";

import React, { useState } from "react";
import { useMemory } from "@/context/MemoryContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * GuestBanner — A dismissible sticky banner that warns guest users
 * that their stories are stored locally and could be lost.
 * Renders only for unauthenticated users who have at least 1 story saved.
 */
export function GuestBanner() {
  const { user, loading } = useAuth();
  const { people, lang, t } = useMemory();
  const [dismissed, setDismissed] = useState(false);

  // Only show for guests who have written at least 1 story
  // Wait for auth to resolve before showing — avoids Flash of Guest Mode on refresh
  const totalStories = people.reduce((acc, p) => acc + p.memories.length, 0);
  if (loading || user || dismissed || totalStories === 0) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-40 px-4 pt-3 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3 animate-in slide-in-from-top-2 duration-500">
          {/* Icon */}
          <div className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Message */}
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex-1 font-sans">
            {lang === "es"
              ? `Tus ${totalStories} ${totalStories === 1 ? "historia está guardada" : "historias están guardadas"} solo en este dispositivo. `
              : `Your ${totalStories} ${totalStories === 1 ? "story is" : "stories are"} saved on this device only. `}
            <strong>
              {lang === "es"
                ? "Crea una cuenta para no perderlas nunca."
                : "Sign in to never lose them."}
            </strong>
          </p>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex-shrink-0 p-0.5"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
