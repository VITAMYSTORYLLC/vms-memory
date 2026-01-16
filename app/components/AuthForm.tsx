
"use client";

import React, { useState } from "react";
import { Lang } from "../types";
import { TEXT } from "../constants";
import { PrimaryButton } from "./PrimaryButton";
import { FcGoogle } from "react-icons/fc";

interface AuthFormProps {
    mode: "login" | "register" | "reset";
    lang: Lang;
    loading: boolean;
    error: string | null;
    onSubmit: (email: string, password: string) => void;
    onReset?: (email: string) => void;
    onToggleMode: (mode: "login" | "register" | "reset") => void;
    onClearError: () => void;
    onGoogleSignIn?: () => void;
}

export function AuthForm({
    mode,
    lang,
    loading,
    error,
    onSubmit,
    onReset,
    onToggleMode,
    onClearError,
    onGoogleSignIn,
}: AuthFormProps) {
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
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
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
                        className="w-full bg-white dark:bg-midnight-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3 text-lg font-sans text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 focus:ring-2 focus:ring-stone-100 dark:focus:ring-midnight-900 transition-all shadow-sm"
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
                            className="w-full bg-white dark:bg-midnight-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3 text-lg font-sans text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 focus:ring-2 focus:ring-stone-100 dark:focus:ring-midnight-900 transition-all shadow-sm"
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

                {onGoogleSignIn && mode !== "reset" && (
                    <>
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                            <span className="flex-shrink-0 mx-4 text-xs text-stone-400 dark:text-stone-600 font-sans uppercase tracking-widest">{t.or || "OR"}</span>
                            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                        </div>

                        <button
                            type="button"
                            onClick={onGoogleSignIn}
                            className="w-full py-3 bg-white dark:bg-midnight-800 border border-stone-200 dark:border-stone-700 rounded-xl flex items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-midight-700 transition-colors shadow-sm"
                        >
                            <FcGoogle size={20} />
                            <span className="text-stone-700 dark:text-stone-200 font-bold font-sans text-sm">
                                {t.continueWithGoogle || "Continue with Google"}
                            </span>
                        </button>
                    </>
                )}

                <button
                    type="button"
                    onClick={() => onToggleMode(mode === "login" ? "register" : "login")}
                    className="w-full py-2 text-sm text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors font-sans"
                >
                    {mode === "login" ? t.noAccount : t.hasAccount}
                </button>
            </div>
        </form>
    );
}
