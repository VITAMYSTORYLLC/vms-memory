"use client";

import React from "react";
import { MemoryItem, Lang } from "../types";
import { TEXT } from "../constants";
import { formatWhen } from "../utils";
import { stripBoldMarkers } from "../utils/text";

interface ShareCardProps {
    item: MemoryItem;
    lang: Lang;
    userName?: string;
    personName?: string;
}

export function ShareCard({ item, lang, userName, personName }: ShareCardProps) {
    const t = TEXT[lang];

    // Determine if we should show the prompt.
    const isGenericPrompt = item.prompt === t.newStoryTitle ||
        item.prompt === "Nueva Historia" ||
        item.prompt === "New Story";

    const showPrompt = item.prompt && !isGenericPrompt;

    return (
        <div
            id="share-card-content"
            className="w-[1080px] h-[1080px] bg-stone-100 flex flex-col items-center justify-center p-20 relative overflow-hidden font-serif"
            style={{ boxSizing: 'border-box' }}
        >
            {/* The "Screenshot-style" Card */}
            <div className="w-full h-full bg-white rounded-[60px] shadow-2xl overflow-hidden flex flex-col border border-stone-200">

                {/* Header Area (Match app style) */}
                <div className="bg-stone-50 w-full px-16 py-12 flex flex-col items-center border-b border-stone-100 flex-shrink-0">
                    {/* Date at Top */}
                    <div className="text-2xl font-sans font-bold text-stone-300 tracking-[0.3em] uppercase mb-8">
                        {formatWhen(item.createdAt, lang)}
                    </div>

                    {/* Question / Prompt */}
                    {showPrompt && (
                        <div className="text-4xl text-stone-600 italic font-medium text-center px-4 leading-relaxed max-w-4xl">
                            {stripBoldMarkers(item.prompt)}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white p-20 flex flex-col items-center justify-center relative">

                    {/* Optional Memory Image */}
                    {item.imageUrl && (
                        <div className="w-full h-[400px] mb-12 rounded-3xl overflow-hidden shadow-sm flex-shrink-0 border border-stone-100">
                            <img
                                src={item.imageUrl}
                                className="w-full h-full object-cover"
                                alt="Memory"
                                crossOrigin="anonymous"
                            />
                        </div>
                    )}

                    {/* Story Text */}
                    <div className={`leading-relaxed font-serif px-8 w-full text-center font-medium ${item.text.length > 200 ? 'text-4xl' : 'text-6xl'} text-stone-800`}>
                        {item.text}
                    </div>

                    {/* App Logo - Bottom Right (as seen in app screenshot) */}
                    <div className="absolute bottom-6 right-6 w-24 h-24 opacity-80 select-none pointer-events-none">
                        <img
                            src="/logo-transparent.png"
                            className="w-full h-full object-contain"
                            alt="VitaMyStory"
                        />
                    </div>
                </div>

                {/* Bottom decorative bar (mimics the carousel dots area but clean) */}
                <div className="h-16 bg-white w-full flex items-center justify-center">
                    <div className="flex gap-2">
                        <div className="w-12 h-2 bg-stone-800 rounded-full" />
                        <div className="w-2 h-2 bg-stone-200 rounded-full" />
                        <div className="w-2 h-2 bg-stone-200 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Subtle external branding */}
            <div className="absolute bottom-6 text-stone-300 font-sans font-bold uppercase tracking-[0.5em] text-sm">
                VitaMyStory.com
            </div>
        </div>
    );
}
