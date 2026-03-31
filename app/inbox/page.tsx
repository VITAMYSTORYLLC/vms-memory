"use client";

import React from "react";
import { useMemory } from "@/context/MemoryContext";
import BottomNav from "@/components/layout/BottomNav";
import { ArrowButton } from "@/components/ui/ArrowButton";
import { useRouter } from "next/navigation";
import { TEXT } from "@/constants";
import { Person, MemoryItem } from "@/types";

export default function InboxPage() {
    const { lang, pendingMemories, activePerson, setPeople, setActivePersonId, setIsCustomMode, setStoryDraft, t } = useMemory();
    const router = useRouter();

    const handleApprove = (memoryId: string) => {
        if (!activePerson) return;
        
        setPeople((prev: Person[]) => prev.map((p: Person) => {
            if (p.id !== activePerson.id) return p;
            return {
                ...p,
                memories: p.memories.map((m: MemoryItem) => m.id === memoryId ? { ...m, status: "published" } as MemoryItem : m)
            }
        }));
    };

    const handleDismiss = (memoryId: string) => {
         if (!activePerson) return;
        
        setPeople((prev: Person[]) => prev.map((p: Person) => {
            if (p.id !== activePerson.id) return p;
            return {
                ...p,
                memories: p.memories.filter((m: MemoryItem) => m.id !== memoryId)
            }
        }));
    };

    const handleEdit = (memoryId: string, prompt: string, text: string) => {
        // For editing, we switch to custom mode with the pending story's text
        setActivePersonId(activePerson?.id || "");
        setIsCustomMode(true);
        setStoryDraft(text);
        // Navigate home to edit
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6] dark:bg-midnight-950 pb-24 transition-colors duration-500 text-stone-900 dark:text-stone-100 font-sans safe-top">
            <div className="max-w-2xl mx-auto">
                <header className="sticky top-0 z-30 bg-[#F9F8F6]/80 dark:bg-midnight-950/80 backdrop-blur-md px-4 py-4 flex items-center shadow-sm border-b border-stone-200 dark:border-stone-800">
                    <ArrowButton direction="left" disabled={false} onClick={() => router.back()} />
                    <h1 className="text-xl font-serif font-bold mx-4 flex-1 text-center">
                        {lang === "es" ? "Bandeja de Entrada" : "Inbox"}
                    </h1>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </header>

                <main className="p-4 space-y-6">
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-serif font-bold mb-2">
                            {lang === "es" ? "Contribuciones Pendientes" : "Pending Contributions"}
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                            {lang === "es" 
                                ? "Historias escritas por tu familia para ti. Apruébalas para agregarlas a la línea de tiempo." 
                                : "Stories written by family for you. Approve them to add to the timeline."}
                        </p>
                    </div>

                    {pendingMemories.length === 0 ? (
                        <div className="bg-white dark:bg-midnight-900 rounded-2xl p-8 text-center border border-stone-100 dark:border-stone-800 shadow-sm mt-8 mx-auto max-w-md">
                            <div className="text-stone-300 dark:text-stone-700 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200 mb-2">
                                {lang === "es" ? "Todo al día" : "All caught up"}
                            </h3>
                            <p className="text-stone-500 dark:text-stone-400">
                                {lang === "es" 
                                    ? "No hay nuevas historias esperando tu aprobación." 
                                    : "No new stories waiting for your approval."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingMemories.map((memory: MemoryItem) => (
                                <div key={memory.id} className="bg-white dark:bg-midnight-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-[10px] font-bold uppercase tracking-widest rounded-md mb-2">
                                                {memory.authorName || "Family"}
                                            </span>
                                            <h3 className="font-serif font-bold text-lg leading-snug">
                                                {memory.prompt}
                                            </h3>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-stone-50 dark:bg-midnight-950 rounded-xl p-4 mb-5 border border-stone-100 dark:border-stone-800">
                                        {memory.imageUrl && (
                                            <div className="mb-4 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                                                <img src={memory.imageUrl} alt="Attached memory" className="w-full h-48 object-cover" />
                                            </div>
                                        )}
                                        <p className="font-serif leading-relaxed text-stone-700 dark:text-stone-300">
                                            {memory.text}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        <button
                                            onClick={() => handleApprove(memory.id)}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            {lang === "es" ? "Aprobar" : "Approve"}
                                        </button>
                                        
                                        {/* Optional Edit Button 
                                        <button
                                            onClick={() => handleEdit(memory.id, memory.prompt, memory.text)}
                                            className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm"
                                        >
                                            {lang === "es" ? "Editar" : "Edit"}
                                        </button>
                                        */}

                                        <button
                                            onClick={() => handleDismiss(memory.id)}
                                            className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm"
                                        >
                                            {lang === "es" ? "Descartar" : "Dismiss"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
            <BottomNav />
        </div>
    );
}
