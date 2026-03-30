"use client";

import React, { useState, useEffect } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useMemory } from "@/context/MemoryContext";

export function PostTutorial() {
    const { lang } = useMemory();
    const [step, setStep] = useState<0 | 1 | 2 | null>(null);

    useEffect(() => {
        const hasSeen = localStorage.getItem("vms_post_tutorial");
        if (!hasSeen) {
            setStep(0);
        }
    }, []);

    if (step === null || step >= 2) return null;

    const handleNext = () => {
        if (step === 0) {
            setStep(1);
        } else {
            setStep(2);
            localStorage.setItem("vms_post_tutorial", "true");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F9F8F6] flex flex-col items-center justify-between p-6 overflow-hidden animate-in fade-in duration-300">
            <div className="w-full flex justify-end mb-4">
                <button 
                    onClick={() => { setStep(2); localStorage.setItem("vms_post_tutorial", "true"); }} 
                    className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 font-sans"
                >
                    {lang === 'es' ? 'Saltar' : 'Skip'}
                </button>
            </div>

            <div className="flex-1 w-full flex items-center justify-center -mt-6">
                <img 
                    src={`/assets/images/tutorial-${step + 1}.png`} 
                    alt="Tutorial Step" 
                    className="max-h-full w-auto object-contain rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                />
            </div>

            <div className="w-full mt-8 max-w-sm space-y-6 pb-8">
                <div className="flex justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${step === 0 ? 'bg-stone-900' : 'bg-stone-300'}`} />
                    <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-stone-900' : 'bg-stone-300'}`} />
                </div>
                
                <PrimaryButton onClick={handleNext}>
                    {step === 0 ? (lang === 'es' ? 'Siguiente' : 'Next') : (lang === 'es' ? 'Comenzar' : 'Get Started')}
                </PrimaryButton>
            </div>
        </div>
    );
}
