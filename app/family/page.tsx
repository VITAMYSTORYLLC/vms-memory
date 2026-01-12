"use client";

import React from "react";
import { useMemory } from "../context/MemoryContext";
import { PrimaryButton } from "../components/PrimaryButton";
import { useRouter } from "next/navigation";
import { plural, normalize } from "../utils";
import { renderWithBoldName } from "../utils/text";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";

export default function FamilyPage() {
    const { people, activePersonId, setActivePersonId, startNewPerson, t, lang, setLang, nameDraft, setNameDraft, user } = useMemory();
    const router = useRouter();
    const { loading: authLoading, error: authError, signUp, signIn, resetPassword, clearError } = useAuth();

    // Local state for creation flow
    // If we have people, we default to showing the list. If not, we show the welcome screen to create the first one.
    // However, if we just want to create a new story, maybe we don't force creation unless there are no people.
    // But the user said "this should be the first screen users should see when you are creating a new story" -> implying the "Ask Name" screen?
    // "the one asking the name should be under family"
    // So "Family" tab -> List of people. Button "Add Person" -> "Ask Name" screen.
    // If 0 people -> "Ask Name" screen directly? Yes.

    const [mode, setMode] = React.useState<"LIST" | "WELCOME" | "INTRO" | "login" | "register" | "reset">(
        people.length === 0 ? "WELCOME" : "LIST"
    );

    // Sync mode if people change (e.g. loaded)
    React.useEffect(() => {
        if (people.length === 0 && mode === "LIST") {
            setMode("WELCOME");
        }
    }, [people.length]);

    function handleSelect(id: string) {
        setActivePersonId(id);
        router.push("/");
    }

    function handleStartCreating() {
        startNewPerson(); // Resets activePerson to null, clears nameDraft
        setMode("WELCOME");
    }

    // Copying renderWithBoldName logic or importing it? 
    // It's in ../utils/text
    // We need to import it.

    if (mode === "LIST") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-stone-950 safe-top safe-bottom pb-24 transition-colors duration-500">
                <div className="w-full max-w-lg font-sans h-full sm:h-auto overflow-y-auto">
                    <div className="p-6 pt-12">
                        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-8">{t.familyTitle}</h1>

                        <div className="space-y-4">
                            {people.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelect(p.id)}
                                    className={`w-full text-left p-5 rounded-2xl transition-all border ${p.id === activePersonId ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-lg scale-[1.02]" : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-2xl font-serif leading-none mb-2 font-bold">{p.name}</div>
                                            <div className={`text-sm uppercase tracking-wider font-sans ${p.id === activePersonId ? "text-stone-400 dark:text-stone-500" : "text-stone-400 dark:text-stone-600 font-bold"}`}>
                                                {p.memories.length} {plural(p.memories.length, lang === "es" ? "historia" : "story")}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8">
                            <PrimaryButton onClick={handleStartCreating}>
                                {t.newPerson}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // WELCOME / INTRO FLOW (Ported from page.tsx)
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-stone-950 text-stone-900 dark:text-stone-100 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg sm:px-4 font-sans h-full sm:h-auto">
                <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex-1 flex flex-col overflow-hidden h-full">

                    {/* Back button if we have people and are just cancelling creation */}
                    {people.length > 0 && mode === "WELCOME" && (
                        <button onClick={() => setMode("LIST")} className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400 font-sans z-20">
                            ← {t.back}
                        </button>
                    )}

                    {mode === "WELCOME" && (
                        <div className="flex-1 flex flex-col justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-700 relative pb-12">

                            <div className="space-y-4">
                                <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">{t.welcomeTitle}</h1>
                                <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed max-w-xs mx-auto font-serif italic">{t.welcomeBody}</p>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700 font-sans">{t.whoFor}</label>
                                    <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder={t.placeholder} className="w-full bg-transparent border-b-2 border-stone-100 dark:border-stone-800 p-2 text-center text-3xl font-serif text-stone-800 dark:text-stone-200 placeholder:text-stone-200 dark:placeholder:text-stone-800 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors" autoFocus />
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <PrimaryButton disabled={!normalize(nameDraft)} onClick={() => setMode("INTRO")}>{t.continue}</PrimaryButton>
                            </div>
                            {!user && (
                                <div className="mt-4 flex justify-center gap-4">
                                    <button onClick={() => setMode("login")} className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 underline font-sans">{t.login}</button>
                                    <button onClick={() => setMode("register")} className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 underline font-sans">{t.register}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "INTRO" && (
                        <div className="flex-1 flex flex-col justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-12">
                            <div className="space-y-8 px-6">
                                <div className="relative inline-block mx-auto mb-4">
                                    <div className="text-5xl animate-breathing">✍️</div>
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{t.introTitle}</h2>
                                <div className="space-y-6">
                                    <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed whitespace-pre-line font-serif italic">{renderWithBoldName(t.introBody(nameDraft))}</p>
                                </div>
                            </div>
                            <div className="pt-6 px-4">
                                <PrimaryButton onClick={() => router.push("/")}>{t.startWriting}</PrimaryButton>
                            </div>
                        </div>
                    )}

                    {(mode === "login" || mode === "register" || mode === "reset") && (
                        <AuthModal
                            mode={mode}
                            lang={lang}
                            loading={authLoading}
                            error={authError}
                            onSubmit={async (email, password) => {
                                const success = mode === "login" ? await signIn(email, password) : await signUp(email, password);
                                if (success) setMode(people.length > 0 ? "LIST" : "WELCOME");
                            }}
                            onReset={resetPassword}
                            onToggleMode={(newMode) => setMode(newMode)}
                            onClose={() => setMode("WELCOME")}
                            onClearError={clearError}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
