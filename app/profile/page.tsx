"use client";

import React, { useState } from "react";
import { useMemory } from "../context/MemoryContext";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import { compressImage } from "../utils";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { useRouter } from "next/navigation";
import { FiCamera, FiEdit2, FiCheck, FiLogOut, FiDownload, FiTrash2, FiUser, FiMail } from "react-icons/fi";

export default function ProfilePage() {
    const { user, handleLogout, resetApp, lang, setLang, theme, setTheme, t, people, userName, setUserName, isHydrated } = useMemory();
    const { loading: authLoading, error: authError, signUp, signIn, signInWithGoogle, resetPassword, clearError } = useAuth();
    const router = useRouter();

    const [authMode, setAuthMode] = useState<"login" | "register" | "reset" | null>(null);
    const [profileImage, setProfileImage] = useState<string>("");
    const [isEditingName, setIsEditingName] = useState(false);

    // Load profile image on mount
    React.useEffect(() => {
        const stored = window.localStorage.getItem("vms_user_photo");
        if (stored) setProfileImage(stored);
    }, []);

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const result = await compressImage(file);
            setProfileImage(result);
            window.localStorage.setItem("vms_user_photo", result);
        } catch (err) {
            console.error(err);
        }
    }

    async function downloadBackup() {
        if (people.length === 0) return;

        const data = {
            app: "VitaMyStory",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            people: people
        };

        const jsonString = JSON.stringify(data, null, 2);
        const filename = `vita-collection-${new Date().toISOString().split("T")[0]}.json`;

        // Try Web Share API first (works on mobile/tablet)
        if (navigator.share && navigator.canShare) {
            try {
                const blob = new Blob([jsonString], { type: "application/json" });
                const file = new File([blob], filename, { type: "application/json" });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: "VitaMyStory Collection",
                        text: "Your memory collection backup"
                    });
                    return;
                }
            } catch (err) {
                console.log("Share API failed, trying download...", err);
                // Fall through to traditional download
            }
        }

        // Fallback: Traditional download (for desktop browsers)
        try {
            const blob = new Blob([jsonString], { type: "application/json" });
            const href = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = href;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
        } catch (err) {
            // Last resort: Copy to clipboard
            try {
                await navigator.clipboard.writeText(jsonString);
                alert("Backup copied to clipboard! Paste it into a text file to save.");
            } catch (clipErr) {
                alert("Unable to export. Please try on a different browser.");
            }
        }
    }

    if (!isHydrated) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F6] dark:bg-midnight-950 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg mx-auto font-sans">
                <div className="p-6 pt-12 space-y-8">

                    {/* Header: Avatar & Identity */}
                    <div className="flex items-center gap-6 px-2">
                        {/* Avatar (Left) */}
                        <div className="relative group shrink-0">
                            <input type="file" accept="image/*" className="hidden" id="profile-upload" onChange={handleImageUpload} />
                            <label htmlFor="profile-upload" className="block w-28 h-28 rounded-full overflow-hidden bg-stone-100 dark:bg-midnight-900 shadow-md border-4 border-white dark:border-midnight-800 transition-all cursor-pointer relative group-hover:scale-105">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                                        <FiUser size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiCamera className="text-white drop-shadow-md" size={28} />
                                </div>
                            </label>
                            <label htmlFor="profile-upload" className="absolute bottom-1 right-1 bg-white dark:bg-midnight-800 p-2.5 rounded-full shadow-lg border border-stone-100 dark:border-stone-700 cursor-pointer hover:bg-stone-50 transition-colors z-10">
                                <FiEdit2 size={14} className="text-stone-700 dark:text-stone-300" />
                            </label>
                        </div>

                        {/* Name & Info (Right) */}
                        <div className="flex-1 min-w-0">
                            {isEditingName ? (
                                <div className="relative">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={userName}
                                        placeholder={t.tapToName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        onBlur={() => {
                                            if (userName.trim()) setIsEditingName(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") setIsEditingName(false);
                                        }}
                                        className="w-full bg-transparent border-b-2 border-stone-900 dark:border-stone-100 px-0 py-1 text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none transition-all"
                                    />
                                    <button onClick={() => setIsEditingName(false)} className="absolute right-0 bottom-2 text-stone-900 dark:text-stone-100 p-1 hover:bg-stone-100 dark:hover:bg-midnight-800 rounded-full transition-colors">
                                        <FiCheck size={24} />
                                    </button>
                                </div>
                            ) : (
                                <div className="group flex items-baseline gap-3 cursor-pointer select-none" onClick={() => setIsEditingName(true)}>
                                    <h1 className={`text-3xl font-serif font-bold leading-tight truncate ${userName ? "text-stone-900 dark:text-stone-100" : "text-stone-300 dark:text-stone-700"}`}>
                                        {userName || t.tapToName}
                                    </h1>
                                    <FiEdit2 size={18} className="text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors shrink-0 translate-y-1" />
                                </div>
                            )}

                            <div className="mt-2 space-y-1">
                                <p className="text-stone-500 dark:text-stone-400 text-sm font-medium tracking-wide font-sans">
                                    {user ? user.email : t.guestMode}
                                </p>
                                <p className="text-xs text-stone-400 dark:text-stone-600 font-sans italic">
                                    {t.displayNameHint}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 p-8 space-y-8">
                        {/* Theme */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 pl-1">{t.theme}</label>
                            <div className="flex bg-stone-100 dark:bg-black/40 rounded-2xl p-1.5 shadow-inner">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${theme === "light" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"}`}
                                >
                                    {t.themeLight}
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${theme === "dark" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"}`}
                                >
                                    {t.themeDark}
                                </button>
                            </div>
                        </div>

                        {/* Language */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 pl-1">{t.experience}</label>
                            <div className="flex bg-stone-100 dark:bg-black/40 rounded-2xl p-1.5 shadow-inner">
                                <button
                                    onClick={() => setLang("en")}
                                    className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${lang === "en" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLang("es")}
                                    className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${lang === "es" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"}`}
                                >
                                    Español
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Data & Collection Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 p-8 space-y-6">
                        <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 pl-1">{t.collection}</label>
                        <div className="space-y-4">
                            <button
                                onClick={downloadBackup}
                                className="w-full py-4 px-6 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold text-sm hover:bg-stone-50 dark:hover:bg-midnight-800 transition-all flex items-center justify-center gap-3 group"
                            >
                                <FiDownload size={18} className="text-stone-400 dark:text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
                                <span>{t.exportCollection}</span>
                            </button>

                            <button
                                onClick={() => { if (confirm(t.resetConfirm)) { resetApp(); router.push("/"); } }}
                                className="w-full py-3 text-red-400 hover:text-red-500 dark:text-red-400/80 dark:hover:text-red-400 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2.5 opacity-80 hover:opacity-100"
                            >
                                <FiTrash2 size={14} />
                                <span>{t.clearData}</span>
                            </button>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 p-8 space-y-6">
                        <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 pl-1">{t.support}</label>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-stone-900 dark:text-stone-100 font-serif font-bold text-2xl mb-2">{t.contactTitle}</h3>
                                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{t.contactSubtitle}</p>
                            </div>
                            <a
                                href="mailto:hello@vitamystory.com"
                                className="w-full py-4 rounded-2xl bg-stone-50 dark:bg-midnight-950 text-stone-900 dark:text-stone-100 font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-stone-100 dark:hover:bg-stone-900 transition-all flex items-center justify-center gap-3 border border-stone-100 dark:border-stone-800"
                            >
                                <FiMail size={16} />
                                <span>{t.contactBtn}</span>
                            </a>
                        </div>
                    </div>

                    {/* Auth & Exit */}
                    <div className="pt-4">
                        {user ? (
                            <button
                                onClick={() => { handleLogout(); router.push("/"); }}
                                className="w-full py-5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold uppercase tracking-[0.2em] text-sm shadow-xl shadow-stone-200/50 dark:shadow-none hover:bg-stone-800 dark:hover:bg-white transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <FiLogOut size={18} />
                                <span>{t.signOut}</span>
                            </button>
                        ) : (
                            <div className="bg-stone-900 dark:bg-stone-100 rounded-[2rem] p-10 text-center space-y-8 shadow-xl shadow-stone-200/50 dark:shadow-none">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center mx-auto mb-6 text-white dark:text-stone-900">
                                        <FiUser size={24} />
                                    </div>
                                    <h3 className="text-white dark:text-stone-900 text-2xl font-serif font-bold">{t.secureStoriesTitle}</h3>
                                    <p className="text-stone-400 dark:text-stone-600 text-sm px-2 leading-relaxed">{t.secureStoriesBody}</p>
                                </div>
                                <button
                                    onClick={() => setAuthMode("login")}
                                    className="w-full py-4 rounded-xl bg-white dark:bg-midnight-900 text-stone-900 dark:text-stone-100 font-bold uppercase tracking-[0.2em] text-xs hover:bg-stone-100 dark:hover:bg-midnight-800 transition-all"
                                >
                                    {t.loginBtn} / {t.registerBtn}
                                </button>
                            </div>
                        )}

                        <div className="text-center pt-12 pb-6 opacity-30">
                            <span className="text-stone-400 dark:text-stone-600 text-[10px] font-bold uppercase tracking-[0.3em]">VitaMyStory © 2026</span>
                        </div>
                    </div>

                </div>
            </div>

            {authMode && (
                <AuthModal
                    mode={authMode}
                    lang={lang}
                    loading={authLoading}
                    error={authError}
                    onSubmit={async (email, password) => {
                        const success = authMode === "login" ? await signIn(email, password) : await signUp(email, password);
                        if (success) {
                            setAuthMode(null);
                        }
                    }}
                    onReset={resetPassword}
                    onToggleMode={(newMode) => setAuthMode(newMode)}
                    onClose={() => setAuthMode(null)}
                    onGoogleSignIn={async () => {
                        await signInWithGoogle();
                        setAuthMode(null);
                    }}
                    onClearError={clearError}
                />
            )}
        </div>
    );
}
