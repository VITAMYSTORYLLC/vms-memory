import React, { useEffect } from "react";
import { useMemory } from "../context/MemoryContext";
import { FiCheckCircle, FiInfo, FiStar, FiX } from "react-icons/fi";

const TOAST_DURATION = 4000;

export default function Toast() {
    const { activeToast, hideToast } = useMemory();

    useEffect(() => {
        if (activeToast) {
            const timer = setTimeout(() => {
                hideToast();
            }, TOAST_DURATION);
            return () => clearTimeout(timer);
        }
    }, [activeToast, hideToast]);

    if (!activeToast) return null;

    const getIcon = () => {
        switch (activeToast.type) {
            case "success": return <FiCheckCircle className="text-green-500" size={20} />;
            case "feature": return <FiStar className="text-purple-500" size={20} />;
            case "info":
            default: return <FiInfo className="text-blue-500" size={20} />;
        }
    };

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-2xl p-4 flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight mb-1">
                        {activeToast.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                        {activeToast.message}
                    </p>
                </div>
                <button
                    onClick={hideToast}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                    <FiX size={16} />
                </button>
            </div>
        </div>
    );
}
