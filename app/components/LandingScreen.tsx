"use client";

import React, { useState } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { useMemory } from "../context/MemoryContext";
import { AuthModal } from "./AuthModal";
import { AuthForm } from "./AuthForm";
import { useAuth } from "../hooks/useAuth";

export default function LandingScreen() {
    const { completeOnboarding, lang, setLang, t, setTheme } = useMemory();
    const { loading: authLoading, error: authError, signUp, signIn, signInWithGoogle, resetPassword, clearError } = useAuth();
    const [authMode, setAuthMode] = useState<"login" | "register" | "reset" | null>("login");

    // Enforce Light Mode on Landing Screen
    React.useEffect(() => {
        setTheme("light");
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-[#F9F8F6] dark:bg-stone-950 flex flex-col overflow-y-auto transition-colors duration-500">
            {/* Lang Switch */}
            <div className="absolute top-6 right-6 flex gap-6 text-xl font-bold tracking-[0.2em] z-10 font-sans">
                <button onClick={() => setLang("es")} className={`transition-colors py-1 px-1 ${lang === "es" ? "text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100" : "text-stone-300 dark:text-stone-700 hover:text-stone-500 dark:hover:text-stone-500"}`}>ES</button>
                <button onClick={() => setLang("en")} className={`transition-colors py-1 px-1 ${lang === "en" ? "text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100" : "text-stone-300 dark:text-stone-700 hover:text-stone-500 dark:hover:text-stone-500"}`}>EN</button>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center max-w-lg mx-auto w-full animate-in fade-in zoom-in-95 duration-700">
                <div className="mb-2 relative flex justify-center w-full">
                    {/* Using the transparent logo for a seamless look. Removed rounded corners and box-shadow to avoid the "card" effect. */}
                    <img src="/logo-transparent.png" alt="VitaMyStory Logo" className="w-64 h-auto object-contain animate-in fade-in zoom-in duration-700" />
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-300 dark:text-stone-700 mb-8 font-sans">Established 2026</div>

                <p className="text-stone-600 dark:text-stone-400 font-serif text-lg leading-relaxed mb-10 max-w-xs">
                    Begin your legacy. <br />
                    Preserve the stories that matter most.
                </p>

                <div className="w-full space-y-8">
                    <div className="p-6 bg-white dark:bg-midnight-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm">
                        {authMode && (
                            <AuthForm
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
                                onClearError={clearError} // This isn't required by AuthForm, but good to have if props match
                                onGoogleSignIn={async () => {
                                    const success = await signInWithGoogle();
                                    if (success) {
                                        completeOnboarding();
                                    }
                                }}
                            />
                        )}
                    </div>

                    <div className="p-2 bg-transparent space-y-4 font-sans text-center">
                        <p className="text-stone-400 dark:text-stone-600 text-xs max-w-xs mx-auto">
                            {t.guestNote || "Guest mode is for trial only. Log in is recommended to save your stories forever."}
                        </p>
                        <SecondaryButton onClick={completeOnboarding}>
                            {t.continue || "Continue as Guest"}
                        </SecondaryButton>
                    </div>
                </div>
            </div>

            {/* Modal removed as it is now embedded */}
        </div>
    );
}
