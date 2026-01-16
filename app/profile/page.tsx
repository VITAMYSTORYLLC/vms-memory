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

    function downloadBackup() {
        if (people.length === 0) return;
        const data = { app: "VitaMyStory", version: "1.0", exportedAt: new Date().toISOString(), people: people };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const href = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = href; link.download = `vita-collection-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    if (!isHydrated) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F6] dark:bg-midnight-950 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg mx-auto font-sans">
                <div className="p-6 pt-12 space-y-6">

                    {/* Header & Avatar Section */}
                    <div className="flex flex-col items-center text-center space-y-4 mb-4">
                        <div className="relative group">
                            <input type="file" accept="image/*" className="hidden" id="profile-upload" onChange={handleImageUpload} />
                            <label htmlFor="profile-upload" className="block w-24 h-24 rounded-full overflow-hidden bg-stone-100 dark:bg-midnight-900 shadow-inner border border-stone-200 dark:border-stone-800 transition-all cursor-pointer relative group-hover:ring-4 group-hover:ring-stone-200 dark:group-hover:ring-stone-800">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                                        <FiUser size={40} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiCamera className="text-white" size={24} />
                                </div>
                            </label>
                            <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-white dark:bg-midnight-800 p-2 rounded-full shadow-lg border border-stone-100 dark:border-stone-700 cursor-pointer transform translate-x-1/4 translate-y-1/4">
                                <FiEdit2 size={12} className="text-stone-600 dark:text-stone-300" />
                            </label>
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{t.profileTitle}</h1>
                            <p className="text-stone-400 dark:text-stone-600 text-sm font-medium tracking-wide font-sans">
                                {user ? user.email : t.guestMode}
                            </p>
                        </div>
                    </div>

                    {/* Settings Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden divide-y divide-stone-50 dark:divide-stone-800/50">
                        {/* Display Name Section */}
                        <div className="p-6 pb-8 space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 block px-1">{t.identity}</label>
                            <div className="px-1">
                                {isEditingName ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={userName}
                                            placeholder={t.tapToName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            onBlur={() => setIsEditingName(false)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") setIsEditingName(false);
                                            }}
                                            className="w-full bg-stone-50 dark:bg-midnight-950 border-b-2 border-stone-900 dark:border-stone-100 px-0 py-2 text-3xl font-serif text-stone-900 dark:text-stone-100 placeholder:text-stone-200 dark:placeholder:text-stone-800 focus:outline-none transition-all"
                                        />
                                        <button onClick={() => setIsEditingName(false)} className="absolute right-0 bottom-3 text-stone-900 dark:text-stone-100">
                                            <FiCheck size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsEditingName(true)}
                                        className="group cursor-pointer flex items-baseline justify-between py-2 border-b-2 border-transparent hover:border-stone-50 dark:hover:border-stone-800 transition-all"
                                    >
                                        <span className={`text-3xl font-serif leading-tight ${userName ? "text-stone-900 dark:text-stone-100" : "text-stone-200 dark:text-stone-800"}`}>
                                            {userName || t.tapToName}
                                        </span>
                                        <FiEdit2 size={16} className="text-stone-300 dark:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity ml-4" />
                                    </div>
                                )}
                                <p className="text-xs text-stone-400 dark:text-stone-600 mt-3 font-sans italic opacity-80">{t.displayNameHint}</p>
                            </div>
                        </div>

                        {/* Theme Section */}
                        <div className="p-6 space-y-4 bg-stone-50/30 dark:bg-midnight-950/20">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 block px-1">{t.theme}</label>
                            <div className="flex bg-stone-100 dark:bg-midnight-950 rounded-xl p-1 shadow-inner border border-stone-200/50 dark:border-stone-800/50">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${theme === "light" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400"}`}
                                >
                                    {t.themeLight}
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${theme === "dark" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400"}`}
                                >
                                    {t.themeDark}
                                </button>
                            </div>
                        </div>

                        {/* Language Section */}
                        <div className="p-6 space-y-4 bg-stone-50/30 dark:bg-midnight-950/20">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 block px-1">{t.experience}</label>
                            <div className="flex bg-stone-100 dark:bg-midnight-950 rounded-xl p-1 shadow-inner border border-stone-200/50 dark:border-stone-800/50">
                                <button
                                    onClick={() => setLang("en")}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${lang === "en" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400"}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLang("es")}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${lang === "es" ? "bg-white dark:bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400"}`}
                                >
                                    Español
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Management Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 p-6 space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 block px-1">{t.collection}</label>
                        <div className="space-y-3">
                            <SecondaryButton onClick={downloadBackup} className="!py-3 !text-sm flex items-center justify-center gap-2">
                                <FiDownload size={16} />
                                <span>{t.exportCollection}</span>
                            </SecondaryButton>
                            <button
                                onClick={() => { if (confirm(t.resetConfirm)) { resetApp(); router.push("/"); } }}
                                className="w-full py-3 text-red-400 hover:text-red-500 text-xs font-bold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 font-sans"
                            >
                                <FiTrash2 size={14} />
                                <span>{t.clearData}</span>
                            </button>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 p-6 space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 block px-1">{t.support}</label>
                        <div className="space-y-4">
                            <div className="px-1">
                                <h3 className="text-stone-900 dark:text-stone-100 font-serif font-bold text-lg mb-1">{t.contactTitle}</h3>
                                <p className="text-stone-500 dark:text-stone-400 text-sm font-sans">{t.contactSubtitle}</p>
                            </div>
                            <a
                                href="mailto:hello@vitamystory.com"
                                className="w-full py-4 rounded-xl bg-stone-50 dark:bg-midnight-950 text-stone-900 dark:text-stone-100 font-bold uppercase tracking-[0.2em] text-xs hover:bg-stone-100 dark:hover:bg-stone-900 transition-all flex items-center justify-center gap-3 border border-stone-100 dark:border-stone-800 font-sans"
                            >
                                <FiMail size={16} />
                                <span>{t.contactBtn}</span>
                            </a>
                        </div>
                    </div>

                    {/* Auth & Exit */}
                    <div className="pt-2 space-y-4">
                        {user ? (
                            <button
                                onClick={() => { handleLogout(); router.push("/"); }}
                                className="w-full py-4 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-bold uppercase tracking-[0.2em] text-sm shadow-lg hover:bg-stone-800 dark:hover:bg-white transition-all flex items-center justify-center gap-3 active:scale-[0.98] font-sans"
                            >
                                <FiLogOut size={18} />
                                <span>{t.signOut}</span>
                            </button>
                        ) : (
                            <div className="bg-stone-900 dark:bg-stone-100 rounded-3xl p-8 text-center space-y-6 shadow-xl transition-colors">
                                <div className="space-y-2">
                                    <h3 className="text-stone-50 dark:text-stone-950 text-xl font-serif font-bold">{t.secureStoriesTitle}</h3>
                                    <p className="text-stone-400 dark:text-stone-500 text-sm font-sans px-4">{t.secureStoriesBody}</p>
                                </div>
                                <button
                                    onClick={() => setAuthMode("login")}
                                    className="w-full py-4 rounded-xl bg-white dark:bg-midnight-900 text-stone-900 dark:text-stone-100 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-stone-100 transition-all font-sans"
                                >
                                    {t.loginBtn} / {t.registerBtn}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-center pt-8 opacity-40">
                        <span className="text-stone-400 dark:text-stone-600 text-[10px] font-bold uppercase tracking-[0.4em] font-sans">Established 2026</span>
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
