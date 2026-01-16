"use client";

import React, { useState } from "react";
import { Lang } from "../types";
import { TEXT } from "../constants";
import { PrimaryButton } from "./PrimaryButton";
import { FcGoogle } from "react-icons/fc";
import { AuthForm } from "./AuthForm";

interface AuthModalProps {
    mode: "login" | "register" | "reset";
    lang: Lang;
    loading: boolean;
    error: string | null;
    onSubmit: (email: string, password: string) => void;
    onReset?: (email: string) => void;
    onToggleMode: (mode: "login" | "register" | "reset") => void;
    onClose: () => void;
    onClearError: () => void;
    onGoogleSignIn?: () => void;
}

export function AuthModal({
    mode,
    lang,
    loading,
    error,
    onSubmit,
    onReset,
    onToggleMode,
    onClose,
    onClearError,
    onGoogleSignIn,
}: AuthModalProps) {
    const t = TEXT[lang];

    return (
        <div className="fixed inset-0 z-[100] bg-[#F9F8F6] dark:bg-midnight-950 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-300 transition-colors duration-500">
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center space-y-8">
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                        {mode === "login" ? t.login : mode === "register" ? t.register : t.forgotPassword}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 text-base leading-relaxed max-w-xs mx-auto font-sans">
                        {mode === "login" ? t.loginSubtitle : mode === "register" ? t.registerSubtitle : t.resetSubtitle}
                    </p>
                </div>

                <AuthForm
                    mode={mode}
                    lang={lang}
                    loading={loading}
                    error={error}
                    onSubmit={onSubmit}
                    onReset={onReset}
                    onToggleMode={onToggleMode}
                    onClearError={onClearError}
                    onGoogleSignIn={onGoogleSignIn}
                />

                <div className="pt-4">
                    <button
                        onClick={onClose}
                        className="w-full py-4 text-sm text-stone-300 dark:text-stone-700 hover:text-stone-500 dark:hover:text-stone-500 transition-colors font-sans font-medium uppercase tracking-[0.2em]"
                    >
                        {t.back || "Go Back"}
                    </button>
                </div>
            </div>
        </div>
    );
}
