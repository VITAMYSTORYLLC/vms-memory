"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TEXT } from "../../constants";
import { PrimaryButton } from "../../components/PrimaryButton";
import { base64ToBlob, compressImage } from "../../utils";

export default function AnswerPage() {
    const params = useParams();
    const linkId = params.linkId as string;
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    // Data from the link
    const [prompt, setPrompt] = useState("");
    const [personName, setPersonName] = useState("");
    const [ownerId, setOwnerId] = useState("");
    const [lang, setLang] = useState<"en" | "es">("en");

    // Form state
    const [authorName, setAuthorName] = useState("");
    const [text, setText] = useState("");
    const [imageStr, setImageStr] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const t = TEXT[lang];

    useEffect(() => {
        // In a real app with Firebase, we would fetch the shared link data here using linkId.
        // For now, since we are using local storage primarily but adding Firebase, 
        // we'll simulate fetching the link data or decode it if we passed it in the URL hash.
        // Since we need to support non-app users, this page MUST read from Firebase in the real implementation.

        async function fetchLinkData() {
            try {
                // TODO: Implement Firebase fetch for the shared link ID
                // For this prototype, we'll extract data from the hash if present, or show a placeholder.
                const hash = window.location.hash.substring(1);
                if (hash) {
                    try {
                        const decoded = JSON.parse(decodeURIComponent(escape(atob(hash))));
                        setPrompt(decoded.prompt || "Share a memory");
                        setPersonName(decoded.personName || "our family");
                        setOwnerId(decoded.ownerId || "");
                        setLang(decoded.lang || "en");
                    } catch (e) {
                        console.error("Failed to parse hash", e);
                        setError("Invalid link format");
                    }
                } else {
                    // Fallback for demo
                    setPrompt("What is your favorite memory of us?");
                    setPersonName("the family");
                }
            } catch (err) {
                setError("Failed to load request");
            } finally {
                setLoading(false);
            }
        }

        fetchLinkData();
    }, [linkId]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setImageStr(compressed);
        } catch (err) {
            console.error("Error compressing image", err);
            alert("Failed to process image");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authorName.trim() || (!text.trim() && !imageStr)) return;
        
        setIsSubmitting(true);
        try {
            // In a real implementation, we would POST this to an API route to save to Firebase
            // The API route would save it to the owner's `pendingMemories` collection.
            
            // Simulating API call
            const payload = {
                linkId,
                ownerId,
                authorName,
                text,
                imageStr,
                createdAt: Date.now()
            };

            const res = await fetch('/api/submit-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to submit");
            
            setSuccess(true);
        } catch (err) {
            console.error("Submit error", err);
            alert("Failed to send memory. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center font-serif text-stone-500">Loading...</div>;
    }

    if (error) {
        return <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center font-serif text-red-500">{error}</div>;
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h1 className="text-3xl font-serif font-bold text-stone-900">Thank You!</h1>
                <p className="text-stone-500 font-sans max-w-sm">Your memory has been sent securely to {personName}'s collection.</p>
                <div className="mt-8 pt-8 border-t border-stone-200">
                    <p className="text-xs text-stone-400 font-sans uppercase tracking-widest mb-4">Powered by</p>
                    <img src="/logo-transparent.png" alt="Vita My Story" className="w-24 mx-auto mix-blend-multiply opacity-50" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center py-12 px-4 sm:px-6">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
                {/* Header */}
                <div className="bg-stone-50 px-8 py-10 text-center border-b border-stone-100">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">
                        Question for {personName}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800 leading-snug">
                        {prompt}
                    </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-stone-400 font-sans">Your Name (Required)</label>
                        <input 
                            type="text" 
                            required
                            value={authorName}
                            onChange={e => setAuthorName(e.target.value)}
                            placeholder="e.g. Grandma, Uncle Joe, Maria" 
                            className="w-full p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-stone-200 text-stone-800 font-serif"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-stone-400 font-sans">Your Memory</label>
                        <textarea 
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Type your answer or story here..." 
                            className="w-full h-40 p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-stone-200 text-stone-800 font-serif resize-none"
                        />
                        
                        {/* Optional Photo Upload */}
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer relative overflow-hidden">
                            {imageStr ? (
                                <>
                                    <img src={imageStr} alt="Attached" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <p className="text-white font-bold text-sm tracking-widest uppercase">Change Photo</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <svg className="mx-auto h-8 w-8 text-stone-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="text-sm font-serif text-stone-500">Attach a photo (optional)</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handlePhotoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <PrimaryButton disabled={isSubmitting || !authorName.trim() || (!text.trim() && !imageStr)}>
                            {isSubmitting ? "Sending..." : "Send Memory"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
            
            <div className="mt-8">
                <img src="/logo-transparent.png" alt="Vita My Story" className="w-24 mix-blend-multiply opacity-40" />
            </div>
        </div>
    );
}
