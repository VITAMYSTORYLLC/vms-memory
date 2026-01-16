"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { refineStory } from "../utils/ai";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { Haptics } from "../utils/haptics";

interface RefineModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalText: string;
    prompt: string;
    lang: 'en' | 'es';
    t: any;
    onAccept: (refinedText: string) => void;
}

export function RefineModal({ isOpen, onClose, originalText, prompt, lang, t, onAccept }: RefineModalProps) {
    const [refinements, setRefinements] = useState<string[]>([]);
    const [activeRefinementIndex, setActiveRefinementIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && originalText) {
            // Reset state on open
            setRefinements([]);
            setActiveRefinementIndex(0);
            handleRefine();
        } else {
            setRefinements([]);
            setError(null);
        }
    }, [isOpen]);

    async function handleRefine() {
        if (refinements.length >= 2) {
            // Only allow 2 generations
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await refineStory(originalText, prompt, lang);
            setRefinements(prev => {
                const newRefinements = [...prev, result];
                setActiveRefinementIndex(newRefinements.length - 1); // Auto-switch to new one
                return newRefinements;
            });
            Haptics.medium();
        } catch (err: any) {
            console.error("Refine Error:", err);
            setError(err.message || "ERROR");
        } finally {
            setLoading(false);
        }
    }

    const currentRefinedText = refinements[activeRefinementIndex] || "";
    const isLimitReached = refinements.length >= 2;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-midnight-900/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-midnight-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-stone-100 dark:border-stone-800"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-midnight-950/50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✨</span>
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{t.refineTitle}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">Gemini 2.0 Flash</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Original */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 block px-1">{t.original}</label>
                                    <div className="p-5 bg-stone-50 dark:bg-midnight-950/30 rounded-2xl border border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-serif italic leading-relaxed text-sm">
                                        {originalText}
                                    </div>
                                </div>

                                {/* Refined */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 block">{t.refined}</label>
                                        {refinements.length > 1 && (
                                            <div className="flex gap-1 bg-stone-100 dark:bg-midnight-800 rounded-full p-0.5">
                                                {refinements.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setActiveRefinementIndex(idx)}
                                                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full transition-all ${activeRefinementIndex === idx ? 'bg-white dark:bg-stone-600 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600'}`}
                                                    >
                                                        {lang === 'es' ? 'Ver.' : 'Ver.'} {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 bg-stone-50 dark:bg-midnight-950/50 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-serif leading-relaxed text-base min-h-[150px] flex flex-col justify-center relative transition-all">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                                <div className="w-8 h-8 border-2 border-stone-200 dark:border-stone-700 border-t-stone-900 dark:border-t-stone-100 rounded-full animate-spin" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-stone-400 animate-pulse">{t.refining}</span>
                                            </div>
                                        ) : error ? (
                                            <div className="text-center py-6 px-4">
                                                <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Error</p>
                                                <p className="text-stone-600 dark:text-stone-400 font-serif italic text-sm mb-6 leading-relaxed">
                                                    {error === "QUOTA_EXCEEDED"
                                                        ? (lang === 'es' ? "Límite de cuota excedido. Por favor, intenta de nuevo en un minuto o revisa tu cuenta de Google AI Studio." : "Quota limit exceeded. Please try again in a minute or check your Google AI Studio account.")
                                                        : (error === "INVALID_API_KEY"
                                                            ? (lang === 'es' ? "API Key no válida. Por favor, revisa tu configuración." : "Invalid API Key. Please check your configuration.")
                                                            : (lang === 'es' ? "No se pudo refinar la historia. Revisa tu conexión o intenta más tarde." : "Failed to refine. Check your connection or try again later."))}
                                                </p>
                                                <SecondaryButton onClick={handleRefine}>
                                                    {lang === 'es' ? "Reintentar" : "Try Again"}
                                                </SecondaryButton>
                                            </div>
                                        ) : (
                                            <motion.div
                                                key={activeRefinementIndex}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="animate-in fade-in duration-500"
                                            >
                                                {currentRefinedText}
                                            </motion.div>
                                        )}
                                    </div>
                                    {/* Warnings/Tooltips */}
                                    {isLimitReached && (
                                        <div className="text-[10px] text-center text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg">
                                            {t.limitReached}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        {!loading && !error && currentRefinedText && (
                            <div className="p-6 bg-stone-50/50 dark:bg-midnight-950/50 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-3">
                                <PrimaryButton onClick={() => { onAccept(currentRefinedText); onClose(); }}>
                                    {refinements.length > 1 ? (lang === 'es' ? `Usar Versión ${activeRefinementIndex + 1}` : `Use Version ${activeRefinementIndex + 1}`) : t.useRefinement}
                                </PrimaryButton>

                                <div className="flex gap-3 w-full">
                                    {refinements.length < 2 && (
                                        <button
                                            onClick={handleRefine}
                                            className="flex-1 px-4 py-4 bg-white dark:bg-midnight-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-4.4 3.6-8 8-8 3.3 0 6 2.1 7.2 5M22 12c0 4.4-3.6 8-8 8-3.3 0-6-2.1-7.2-5" /></svg>
                                            {t.refineAgain}
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-4 bg-transparent border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 font-bold rounded-2xl hover:bg-stone-100 dark:hover:bg-midnight-800 transition-colors text-xs sm:text-sm whitespace-nowrap"
                                    >
                                        {t.keepOriginal}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
