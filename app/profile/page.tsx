"use client";

import React, { useState } from "react";
import { useMemory } from "../context/MemoryContext";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import { compressImage } from "../utils";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { useRouter } from "next/navigation";
import { FiCamera, FiEdit2, FiCheck, FiLogOut, FiDownload, FiTrash2, FiUser } from "react-icons/fi";

export default function ProfilePage() {
    const { user, handleLogout, resetApp, lang, setLang, t, people, userName, setUserName, isHydrated } = useMemory();
    const { loading: authLoading, error: authError, signUp, signIn, clearError } = useAuth();
    const router = useRouter();

    const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER" | null>(null);
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
        <div className="min-h-screen flex flex-col bg-[#F9F8F6] safe-top safe-bottom pb-24">
            <div className="w-full max-w-lg mx-auto font-sans">
                <div className="p-6 pt-12 space-y-6">

                    {/* Header & Avatar Section */}
                    <div className="flex flex-col items-center text-center space-y-4 mb-4">
                        <div className="relative group">
                            <input type="file" accept="image/*" className="hidden" id="profile-upload" onChange={handleImageUpload} />
                            <label htmlFor="profile-upload" className="block w-24 h-24 rounded-full overflow-hidden bg-stone-100 hover:ring-4 hover:ring-stone-200 transition-all cursor-pointer relative shadow-inner border border-stone-200">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                                        <FiUser size={40} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiCamera className="text-white" size={24} />
                                </div>
                            </label>
                            <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-stone-100 cursor-pointer transform translate-x-1/4 translate-y-1/4">
                                <FiEdit2 size={12} className="text-stone-600" />
                            </label>
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{t.profileTitle}</h1>
                            <p className="text-stone-400 text-sm font-medium tracking-wide">
                                {user ? user.email : t.guestMode}
                            </p>
                        </div>
                    </div>

                    {/* Settings Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden divide-y divide-stone-50">
                        {/* Display Name Section */}
                        <div className="p-6 pb-8 space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block px-1">{t.identity}</label>
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
                                            className="w-full bg-stone-50 border-b-2 border-stone-900 px-0 py-2 text-3xl font-serif text-stone-900 placeholder:text-stone-200 focus:outline-none transition-all"
                                        />
                                        <button onClick={() => setIsEditingName(false)} className="absolute right-0 bottom-3 text-stone-900">
                                            <FiCheck size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsEditingName(true)}
                                        className="group cursor-pointer flex items-baseline justify-between py-2 border-b-2 border-transparent hover:border-stone-100 transition-all"
                                    >
                                        <span className={`text-3xl font-serif leading-tight ${userName ? "text-stone-900" : "text-stone-200"}`}>
                                            {userName || t.tapToName}
                                        </span>
                                        <FiEdit2 size={16} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity ml-4" />
                                    </div>
                                )}
                                <p className="text-xs text-stone-400 mt-3 font-sans italic opacity-80">{t.displayNameHint}</p>
                            </div>
                        </div>

                        {/* Language Section */}
                        <div className="p-6 space-y-4 bg-stone-50/30">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block px-1">{t.experience}</label>
                            <div className="flex bg-stone-100 rounded-xl p-1 shadow-inner border border-stone-200/50">
                                <button
                                    onClick={() => setLang("en")}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all duration-300 ${lang === "en" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLang("es")}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all duration-300 ${lang === "es" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
                                >
                                    Español
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Management Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block px-1">{t.collection}</label>
                        <div className="space-y-3">
                            <SecondaryButton onClick={downloadBackup} className="!py-3 !text-sm border-stone-200 hover:bg-stone-50 flex items-center justify-center gap-2">
                                <FiDownload size={16} />
                                <span>{t.exportCollection}</span>
                            </SecondaryButton>
                            <button
                                onClick={() => { if (confirm(t.resetConfirm)) { resetApp(); router.push("/"); } }}
                                className="w-full py-3 text-red-400 hover:text-red-500 text-xs font-bold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2"
                            >
                                <FiTrash2 size={14} />
                                <span>{t.clearData}</span>
                            </button>
                        </div>
                    </div>

                    {/* Auth & Exit */}
                    <div className="pt-2 space-y-4">
                        {user ? (
                            <button
                                onClick={() => { handleLogout(); router.push("/"); }}
                                className="w-full py-4 rounded-2xl bg-stone-900 text-stone-50 font-bold uppercase tracking-[0.2em] text-sm shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <FiLogOut size={18} />
                                <span>{t.signOut}</span>
                            </button>
                        ) : (
                            <div className="bg-stone-900 rounded-3xl p-8 text-center space-y-6 shadow-xl">
                                <div className="space-y-2">
                                    <h3 className="text-stone-50 text-xl font-serif font-bold">{t.secureStoriesTitle}</h3>
                                    <p className="text-stone-400 text-sm font-sans px-4">{t.secureStoriesBody}</p>
                                </div>
                                <button
                                    onClick={() => setAuthMode("LOGIN")}
                                    className="w-full py-4 rounded-xl bg-white text-stone-900 font-bold uppercase tracking-[0.2em] text-xs hover:bg-stone-100 transition-all"
                                >
                                    {t.loginBtn} / {t.registerBtn}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-center pt-8 opacity-40">
                        <span className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.4em]">Established 2026</span>
                    </div>

                </div>
            </div>

            {authMode && (
                <AuthModal
                    mode={authMode === "LOGIN" ? "login" : "register"}
                    lang={lang}
                    loading={authLoading}
                    error={authError}
                    onSubmit={async (email, password) => {
                        const success = authMode === "LOGIN" ? await signIn(email, password) : await signUp(email, password);
                        if (success) {
                            setAuthMode(null);
                        }
                    }}
                    onToggleMode={() => setAuthMode(authMode === "LOGIN" ? "REGISTER" : "LOGIN")}
                    onClose={() => setAuthMode(null)}
                    onClearError={clearError}
                />
            )}
        </div>
    );
}
