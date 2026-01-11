"use client";

import React from "react";
import { MemoryItem, Lang } from "../types";
import { formatWhen } from "../utils";
import { stripBoldMarkers } from "../utils/text";

interface ShareCardProps {
    item: MemoryItem;
    lang: Lang;
    userName?: string;
}

export function ShareCard({ item, lang, userName }: ShareCardProps) {
    const cleanPrompt = stripBoldMarkers(item.prompt);

    return (
        <div
            id="share-card-content"
            className="w-[1080px] h-[1080px] bg-[#F9F8F6] flex flex-col p-20 relative overflow-hidden font-serif"
            style={{ boxSizing: 'border-box' }}
        >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-4 bg-stone-900" />
            <div className="absolute top-20 right-20 text-6xl opacity-20 text-stone-300">🕯️</div>

            <div className="flex-1 flex flex-col justify-center space-y-12">
                {/* Header/Prompt */}
                {cleanPrompt && (
                    <div className="space-y-4">
                        <div className="text-xl font-sans font-bold uppercase tracking-[0.4em] text-stone-400">
                            The Question
                        </div>
                        <h2 className="text-5xl text-stone-600 italic leading-tight">
                            {cleanPrompt}
                        </h2>
                    </div>
                )}

                {/* The Memory */}
                <div className="space-y-8">
                    {item.imageUrl && (
                        <div className="w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                            <img src={item.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                        </div>
                    )}

                    <div className="relative">
                        <span className="absolute -top-12 -left-8 text-[12rem] text-stone-100 font-serif leading-none select-none">
                            “
                        </span>
                        <p className={`relative ${item.text.length > 150 ? 'text-4xl' : 'text-5xl'} text-stone-900 leading-relaxed font-serif`}>
                            {item.text}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer / Branding */}
            <div className="pt-12 border-t border-stone-200 flex justify-between items-end">
                <div className="space-y-2">
                    <div className="text-3xl font-bold text-stone-900">VitaMyStory</div>
                    <div className="text-lg font-sans font-bold uppercase tracking-widest text-stone-400">
                        {formatWhen(item.createdAt, lang)}
                    </div>
                </div>

                {userName && (
                    <div className="text-right">
                        <div className="text-sm font-sans font-bold uppercase tracking-widest text-stone-300 mb-1">Preserved by</div>
                        <div className="text-2xl font-bold text-stone-700">{userName}</div>
                    </div>
                )}
            </div>

            {/* Background Texture Overlay (CSS simulation) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")'
                }}
            />
        </div>
    );
}
