"use client";

import React, { useState } from "react";
import { Lang } from "../types";
import { TEXT } from "../constants";
import { PrimaryButton } from "./PrimaryButton";

interface AuthModalProps {
    mode: "login" | "register";
    lang: Lang;
    loading: boolean;
    error: string | null;
    onSubmit: (email: string, password: string) => void;
    onToggleMode: () => void;
    onClose: () => void;
    onClearError: () => void;
}

export function AuthModal({
    mode,
    lang,
    loading,
    error,
    onSubmit,
    onToggleMode,
    onClose,
    onClearError,
}: AuthModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const t = TEXT[lang];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(email, password);
    };

    const isValid = email.includes("@") && password.length >= 6;

    return (
        <div className="flex-1 flex flex-col justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900">
                    {mode === "login" ? t.login : t.register}
                </h1>
                <p className="text-stone-500 text-base leading-relaxed max-w-xs mx-auto font-sans">
                    {mode === "login" ? t.loginSubtitle : t.registerSubtitle}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2 text-left">
                        <label className="text-xs font-bold uppercase tracking-widest text-stone-400 font-sans">
                            {t.email}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); onClearError(); }}
                            placeholder="you@example.com"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-lg font-sans text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-xs font-bold uppercase tracking-widest text-stone-400 font-sans">
                            {t.password}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); onClearError(); }}
                            placeholder="••••••••"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-lg font-sans text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all"
                        />
                        {mode === "register" && (
                            <p className="text-xs text-stone-400 font-sans">{t.passwordHint}</p>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-600 font-sans">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <PrimaryButton disabled={!isValid || loading}>
                        {loading ? t.loading : mode === "login" ? t.loginBtn : t.registerBtn}
                    </PrimaryButton>

                    <button
                        type="button"
                        onClick={onToggleMode}
                        className="text-sm text-stone-400 hover:text-stone-600 transition-colors font-sans"
                    >
                        {mode === "login" ? t.noAccount : t.hasAccount}
                    </button>
                </div>
            </form>

            <button
                onClick={onClose}
                className="text-sm text-stone-300 hover:text-stone-500 transition-colors font-sans"
            >
                {t.back}
            </button>
        </div>
    );
}
