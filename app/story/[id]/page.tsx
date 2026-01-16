"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Person, Lang } from "../../types";
import { StoryCarousel } from "../../components/StoryCarousel";
import { PrimaryButton } from "../../components/PrimaryButton";
import { CommentSection } from "../../components/CommentSection";
import Link from "next/link";

export default function StoryViewer() {
    const { id } = useParams();
    const [person, setPerson] = useState<Person | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState<Lang>("en");

    useEffect(() => {
        async function fetchStory() {
            if (!id) return;
            try {
                const docRef = doc(db, "shared_profiles", id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPerson(docSnap.data() as Person);
                } else {
                    setError("Story not found");
                }
            } catch (err) {
                console.error("Error fetching story:", err);
                setError("Unable to load story");
            } finally {
                setLoading(false);
            }
        }

        fetchStory();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-pulse text-stone-400 font-serif">Opening the book...</div>
            </div>
        );
    }

    if (error || !person) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-8 text-center">
                <h1 className="text-2xl font-serif text-stone-800 mb-4">{error || "Story not found"}</h1>
                <p className="text-stone-500 mb-8 max-w-xs">This story might have been removed or the link is incorrect.</p>
                <Link href="/">
                    <PrimaryButton onClick={() => { }}>Go to Home</PrimaryButton>
                </Link>
            </div>
        );
    }

    const heroImage = person.memories.find(m => m.imageUrl)?.imageUrl;

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-900 selection:bg-stone-200">
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        :root { --font-sans: 'Inter', sans-serif; --font-serif: 'Libre Baskerville', serif; }
        .font-sans { font-family: var(--font-sans); }
        .font-serif { font-family: var(--font-serif); }
      `}</style>

            <div className="w-full max-w-lg px-4 font-sans py-12">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-stone-200/60 overflow-hidden relative border border-stone-100 min-h-[800px] flex flex-col">
                    {/* Hero Section */}
                    <div className="h-64 relative overflow-hidden group">
                        {heroImage ? (
                            <img src={heroImage} className="w-full h-full object-cover" alt={person.name} />
                        ) : (
                            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                                <span className="text-6xl grayscale opacity-20">📖</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                    </div>

                    <div className="px-8 pb-12 -mt-20 relative z-10 flex-1 flex flex-col">
                        <div className="text-center mb-10">
                            <div className="inline-block p-1 bg-white rounded-full shadow-lg mb-4">
                                <div className="w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center text-white text-3xl font-serif">
                                    {person.name.charAt(0)}
                                </div>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 font-sans mb-2">
                                {lang === "es" ? "EL LEGADO DE" : "THE LEGACY OF"}
                            </div>
                            <h1 className="text-4xl font-serif font-bold text-stone-900 leading-tight mb-4">{person.name}</h1>
                            <p className="text-stone-500 font-serif italic text-lg leading-relaxed max-w-sm mx-auto p-4 border-y border-stone-50">
                                {lang === "es"
                                    ? `Celebrando la vida y las historias de ${person.name}. Un lugar donde los recuerdos siguen vivos.`
                                    : `Celebrating the life and stories of ${person.name}. A place where memories live on.`}
                            </p>
                        </div>

                        <div className="flex-1">
                            <StoryCarousel items={[...person.memories].reverse()} lang={lang} />
                            {person.id && <CommentSection personId={person.id} lang={lang} />}
                        </div>

                        <div className="mt-12 text-center space-y-6">
                            <div className="pt-8 border-t border-stone-50">
                                <p className="text-stone-400 text-xs font-sans tracking-widest uppercase mb-6 opacity-60">
                                    {lang === "es"
                                        ? "Creado con VitaMyStory"
                                        : "Created with VitaMyStory"}
                                </p>
                                <Link href="/">
                                    <PrimaryButton onClick={() => { }}>
                                        {lang === "es" ? "Empieza mi propia historia" : "Start my own story"}
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center py-8">
                    <div className="flex justify-center gap-6 text-xs font-bold tracking-[0.2em] text-stone-300 font-sans">
                        <button onClick={() => setLang("en")} className={`transition-colors py-2 ${lang === "en" ? "text-stone-900 border-b-2 border-stone-900" : "hover:text-stone-500"}`}>ENGLISH</button>
                        <button onClick={() => setLang("es")} className={`transition-colors py-2 ${lang === "es" ? "text-stone-900 border-b-2 border-stone-900" : "hover:text-stone-500"}`}>ESPAÑOL</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
