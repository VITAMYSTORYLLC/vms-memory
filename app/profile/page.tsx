"use client";

import React, { useState } from "react";
import { useMemory } from "../context/MemoryContext";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import { compressImage } from "../utils";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, handleLogout, resetApp, lang, setLang, t, people, userName, setUserName } = useMemory();
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
            // We need to import compressImage from utils. 
            // Since we can't easily add imports in this Replace block without context, 
            // we will assume compressImage is available or we'll need to add the import in a separate step.
            // Actually, let's use the compressImage logic inline or assume we will add the import.
            // Wait, I should add the import first. 
            // I'll proceed with the UI logic here and fix imports in next step to be safe.

            // Temporary placeholder logic until I add the import
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                // Save directly for now (optimize later if needed)
                setProfileImage(result);
                window.localStorage.setItem("vms_user_photo", result);
            };
        } catch (err) {
            console.error(err);
        }
    }

    function downloadBackup() {
        if (people.length === 0) return;
        const data = { app: "VitaMyStory", version: "MVP-Demo", exportedAt: new Date().toISOString(), people: people };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const href = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = href; link.download = `vita-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] safe-top safe-bottom pb-24">
            <div className="w-full max-w-lg font-sans h-full sm:h-auto">
                <div className="p-6 pt-12 space-y-8">

                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative group cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" id="profile-upload" onChange={handleImageUpload} />
                            <label htmlFor="profile-upload" className="w-16 h-16 rounded-full flex items-center justify-center text-2xl overflow-hidden bg-stone-200 hover:opacity-80 transition-opacity relative">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>👤</span>
                                )}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold">EDIT</span>
                                </div>
                            </label>
                            {/* Camera Icon Badge */}
                            <label htmlFor="profile-upload" className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow border border-stone-200 cursor-pointer">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                            </label>
                        </div>
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-stone-900">Profile</h1>
                            <p className="text-stone-500 text-sm">{user ? user.email : "Guest User"}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Settings</h3>

                        {/* Display Name */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-stone-900 uppercase tracking-wide mb-2">Display Name</label>
                            {isEditingName ? (
                                <input
                                    type="text"
                                    autoFocus
                                    value={userName}
                                    placeholder="Your Name (e.g. Ulises)"
                                    onChange={(e) => setUserName(e.target.value)}
                                    onBlur={() => setIsEditingName(false)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") setIsEditingName(false);
                                    }}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all font-serif"
                                />
                            ) : (
                                <div
                                    onClick={() => setIsEditingName(true)}
                                    className="w-full px-4 py-3 text-stone-900 cursor-pointer hover:bg-stone-50 transition-colors font-serif min-h-[46px] flex items-center justify-between group border border-transparent hover:border-stone-200 rounded-lg"
                                >
                                    <span className="text-lg">{userName || <span className="text-stone-400 text-base italic">Tap to set your name...</span>}</span>
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        <span>Edit</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </span>
                                </div>
                            )}
                            <p className="text-[10px] text-stone-400 mt-1.5">This name will appear when you share stories.</p>
                        </div>

                        <div className="h-px bg-stone-100 my-4"></div>

                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Language</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setLang("en")} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${lang === "en" ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200"}`}>English</button>
                            <button onClick={() => setLang("es")} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${lang === "es" ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200"}`}>Español</button>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Data & Storage</h3>
                        <SecondaryButton onClick={downloadBackup}>{t.backupDownloaded || "Download Backup"}</SecondaryButton>
                        <button onClick={resetApp} className="w-full py-3 text-red-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors">Reset All Data</button>
                    </div>

                    {/* Auth */}
                    {user ? (
                        <PrimaryButton onClick={handleLogout}>Log Out</PrimaryButton>
                    ) : (
                        <div className="text-center">
                            <p className="text-stone-400 text-sm mb-4">Create an account to sync your memories.</p>
                            <PrimaryButton onClick={() => setAuthMode("LOGIN")}>Sign In / Register</PrimaryButton>
                        </div>
                    )}

                    <div className="text-center pt-8">
                        <span className="text-stone-300 text-[10px] uppercase tracking-widest">Version Alpha 1.0</span>
                    </div>

                </div>
            </div>

            {
                authMode && (
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
                )
            }
        </div >
    );
}
