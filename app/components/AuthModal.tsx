"use client";

import React, { useState } from "react";
import { Lang } from "../types";
import { TEXT } from "../constants";
import { PrimaryButton } from "./PrimaryButton";

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
}: AuthModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [linkSent, setLinkSent] = useState(false);
    const t = TEXT[lang];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "reset") {
            if (onReset) {
                onReset(email);
                setLinkSent(true);
            }
        } else {
            onSubmit(email, password);
        }
    };

    const isValid = mode === "reset" ? email.includes("@") : (email.includes("@") && password.length >= 6);

    return (
        <div className="fixed inset-0 z-[100] bg-[#F9F8F6] dark:bg-stone-950 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-300 transition-colors duration-500">
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center space-y-8">
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                        {mode === "login" ? t.login : mode === "register" ? t.register : t.forgotPassword}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 text-base leading-relaxed max-w-xs mx-auto font-sans">
                        {mode === "login" ? t.loginSubtitle : mode === "register" ? t.registerSubtitle : t.resetSubtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 font-sans">
                                {t.email}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); onClearError(); if (linkSent) setLinkSent(false); }}
                                placeholder="you@example.com"
                                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3 text-lg font-sans text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-900 transition-all shadow-sm"
                                autoFocus
                            />
                        </div>

                        {mode !== "reset" && (
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 font-sans">
                                    {t.password}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); onClearError(); }}
                                    placeholder="••••••••"
                                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3 text-lg font-sans text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-900 transition-all shadow-sm"
                                />
                                {mode === "register" && (
                                    <p className="text-xs text-stone-400 dark:text-stone-600 font-sans">{t.passwordHint}</p>
                                )}
                                {mode === "login" && (
                                    <div className="text-right">
                                        <button
                                            type="button"
                                            onClick={() => onToggleMode("reset")}
                                            className="text-xs text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors font-sans py-1"
                                        >
                                            {t.forgotPassword}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 font-sans text-center">
                            {error}
                        </div>
                    )}

                    {linkSent && !error && (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-lg p-3 text-sm text-green-600 dark:text-green-400 font-sans text-center">
                            {t.resetLinkSent}
                        </div>
                    )}

                    <div className="space-y-3">
                        <PrimaryButton disabled={!isValid || loading}>
                            {loading ? t.loading : mode === "login" ? t.loginBtn : mode === "register" ? t.registerBtn : t.resetBtn}
                        </PrimaryButton>

                        <button
                            type="button"
                            onClick={() => onToggleMode(mode === "login" ? "register" : "login")}
                            className="w-full py-2 text-sm text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors font-sans"
                        >
                            {mode === "login" ? t.noAccount : t.hasAccount}
                        </button>
                    </div>
                </form>

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
