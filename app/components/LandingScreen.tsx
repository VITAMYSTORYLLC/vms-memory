"use client";

import React, { useState } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { useMemory } from "../context/MemoryContext";
import { AuthModal } from "./AuthModal";
import { useAuth } from "../hooks/useAuth";

export default function LandingScreen() {
    const { completeOnboarding, lang, setLang, t } = useMemory();
    const { loading: authLoading, error: authError, signUp, signIn, resetPassword, clearError } = useAuth();
    const [authMode, setAuthMode] = useState<"login" | "register" | "reset" | null>(null);

    return (
        <div className="fixed inset-0 z-50 bg-[#F9F8F6] dark:bg-stone-950 flex flex-col overflow-y-auto transition-colors duration-500">
            {/* Lang Switch */}
            <div className="absolute top-6 right-6 flex gap-6 text-xl font-bold tracking-[0.2em] z-10 font-sans">
                <button onClick={() => setLang("es")} className={`transition-colors py-1 px-1 ${lang === "es" ? "text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100" : "text-stone-300 dark:text-stone-700 hover:text-stone-500 dark:hover:text-stone-500"}`}>ES</button>
                <button onClick={() => setLang("en")} className={`transition-colors py-1 px-1 ${lang === "en" ? "text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100" : "text-stone-300 dark:text-stone-700 hover:text-stone-500 dark:hover:text-stone-500"}`}>EN</button>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center max-w-lg mx-auto w-full animate-in fade-in zoom-in-95 duration-700">
                <div className="mb-8 relative">
                    <div className="text-6xl animate-breathing">✍️</div>
                </div>

                <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">VitaMyStory</h1>
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-300 dark:text-stone-700 mb-8 font-sans">Established 2026</div>

                <p className="text-stone-600 dark:text-stone-400 font-serif text-lg leading-relaxed mb-10 max-w-xs">
                    Begin your legacy. <br />
                    Preserve the stories that matter most.
                </p>

                <div className="w-full space-y-4">
                    <div className="p-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
                        <div className="text-left font-sans">
                            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base uppercase tracking-wider mb-1">Recommended</h3>
                            <p className="text-stone-500 dark:text-stone-400 text-sm">Save your stories to the cloud and access them anywhere.</p>
                        </div>
                        <PrimaryButton onClick={() => setAuthMode("login")}>
                            Log In / Sign Up
                        </PrimaryButton>
                    </div>

                    <div className="p-5 bg-transparent space-y-4 font-sans">
                        <div className="text-left px-1">
                            <p className="text-stone-400 dark:text-stone-600 text-sm">Try it out on this device only. Your data will be lost if you clear your browser cache.</p>
                        </div>
                        <SecondaryButton onClick={completeOnboarding}>
                            Continue as Guest
                        </SecondaryButton>
                    </div>
                </div>
            </div>

            {authMode && (
                <AuthModal
                    mode={authMode}
                    lang={lang}
                    loading={authLoading}
                    error={authError}
                    onSubmit={async (email, password) => {
                        const success = authMode === "login" ? await signIn(email, password) : await signUp(email, password);
                        if (success) {
                            completeOnboarding();
                        }
                    }}
                    onReset={resetPassword}
                    onToggleMode={(mode) => setAuthMode(mode)}
                    onClose={() => setAuthMode(null)}
                    onClearError={clearError}
                />
            )}
        </div>
    );
}
