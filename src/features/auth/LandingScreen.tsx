"use client";

import React, { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { useMemory } from "@/context/MemoryContext";
import { AuthForm } from "./AuthForm";
import { useAuth } from "@/hooks/useAuth";

export default function LandingScreen() {
    const { completeOnboarding, lang, setLang, t, setTheme } = useMemory();
    const { loading: authLoading, error: authError, signUp, signIn, signInWithGoogle, resetPassword, clearError } = useAuth();
    const [authMode, setAuthMode] = useState<"login" | "register" | "reset" | null>("login");
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    // Enforce Light Mode on Landing Screen
    React.useEffect(() => {
        setTheme("light");
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-[#F9F8F6] flex flex-col overflow-y-auto transition-colors duration-500 animate-in fade-in duration-500">
            {/* Logo - Top Left */}
            <div className="absolute top-6 left-6 z-20">
                <img src="/assets/images/logo-transparent.png" alt="VitaMyStory Logo" className="w-32 h-auto object-contain animate-in fade-in slide-in-from-top-4 duration-700 mix-blend-multiply" />
            </div>

            {/* Lang Switch - Top Right, aligned with bottom of logo */}
            <div className="absolute top-[52px] right-6 z-20 font-sans">
                <button
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center gap-2 text-sm font-black tracking-[0.2em] text-stone-900 hover:text-stone-600 transition-colors uppercase bg-transparent p-2 rounded-lg"
                >
                    {lang === 'es' ? 'ESPAÑOL' : 'ENGLISH'}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        className={`w-4 h-4 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {isLangMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => { setLang("en"); setIsLangMenuOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm font-bold tracking-[0.1em] hover:bg-stone-50 transition-colors flex items-center justify-between ${lang === 'en' ? 'text-stone-900 bg-stone-50' : 'text-stone-500'}`}
                        >
                            ENGLISH
                            {lang === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />}
                        </button>
                        <button
                            onClick={() => { setLang("es"); setIsLangMenuOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm font-bold tracking-[0.1em] hover:bg-stone-50 transition-colors flex items-center justify-between ${lang === 'es' ? 'text-stone-900 bg-stone-50' : 'text-stone-500'}`}
                        >
                            ESPAÑOL
                            {lang === 'es' && <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-6 pt-24 text-center max-w-lg mx-auto w-full animate-in fade-in zoom-in-95 duration-700">

                <p className="text-stone-600 font-serif text-lg leading-relaxed mb-10 max-w-xs mt-24">
                    {t.heroTagline} <br />
                    {t.heroSubtagline}
                </p>

                <div className="w-full space-y-8">
                    <div className="p-6 bg-white rounded-2xl border border-stone-100 shadow-sm">
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
                                onClearError={clearError}
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
                        <p className="text-stone-400 text-xs max-w-xs mx-auto">
                            {t.guestNote || "Guest mode is for trial only. Log in is recommended to save your stories forever."}
                        </p>
                        <SecondaryButton onClick={completeOnboarding}>
                            {t.continue || "Continue as Guest"}
                        </SecondaryButton>
                    </div>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-300 mt-auto py-6 font-sans opacity-60 text-center">
                    <div>Established 2024</div>
                    <div>Last updated Feb 12</div>
                </div>
            </div>
        </div>
    );
}
