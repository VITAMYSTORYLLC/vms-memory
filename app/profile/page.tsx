"use client";

import React, { useState, useEffect } from "react";
import { useMemory } from "../context/MemoryContext";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import { compressImage } from "../utils";
import { uploadImage } from "../utils/storage";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { useRouter } from "next/navigation";
import { FiCamera, FiEdit2, FiCheck, FiLogOut, FiDownload, FiTrash2, FiUser, FiMail, FiUsers } from "react-icons/fi";
import ExportModal from "../components/ExportModal";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useFriends } from "../hooks/useFriends";

export default function ProfilePage() {
    const { user, handleLogout, resetApp, lang, setLang, theme, setTheme, t, people, userName, setUserName, isHydrated, userPhoto, setUserPhoto, addNotification } = useMemory();
    const { loading: authLoading, error: authError, signUp, signIn, signInWithGoogle, resetPassword, clearError } = useAuth();
    const router = useRouter();

    const [authMode, setAuthMode] = useState<"login" | "register" | "reset" | null>(null);
    const [profileImage, setProfileImage] = useState<string>("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [hasPurchasedBook, setHasPurchasedBook] = useState(false);
    const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
    const { friends } = useFriends(user?.uid);

    const activePerson = people.find((p) => p.id) ?? people[0] ?? null;

    // Check if user has previously purchased a book export
    useEffect(() => {
        if (!user || !activePerson) return;
        const checkPurchase = async () => {
            try {
                const db = getFirestore();
                const snap = await getDoc(doc(db, "book_purchases", `${user.uid}_${activePerson.id}`));
                setHasPurchasedBook(snap.exists());
            } catch {
                // Non-blocking
            }
        };
        checkPurchase();
    }, [user, activePerson?.id]);

    // Load profile image - Prioritize sync state (userPhoto), then local storage
    React.useEffect(() => {
        if (userPhoto) {
            setProfileImage(userPhoto);
        } else {
            const stored = window.localStorage.getItem("vms_user_photo");
            if (stored) setProfileImage(stored);
        }
    }, [userPhoto]);

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            // 1. Compress
            const result = await compressImage(file);
            setProfileImage(result); // Instant local update

            // 2. Upload to Cloud (if logged in)
            if (user) {
                const blob = await (await fetch(result)).blob();
                const path = `users/${user.uid}/profile`; // Storage util adds filename
                const downloadUrl = await uploadImage(blob, path);

                // 3. Update Sync State
                setUserPhoto(downloadUrl);
            }

            // 4. Save Local Backup
            window.localStorage.setItem("vms_user_photo", result);

        } catch (err) {
            console.error("Upload failed:", err);
            // Fallback: Just keep local update if upload fails
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
            addNotification(t.success, t.backupDownloaded, "success");
        } catch (err) {
            // Last resort: Copy to clipboard
            try {
                await navigator.clipboard.writeText(jsonString);
                addNotification(
                    t.success,
                    lang === "es"
                        ? "Respaldo copiado al portapapeles. Pégalo en un archivo de texto."
                        : "Backup copied to clipboard! Paste it into a text file to save.",
                    "success"
                );
            } catch (clipErr) {
                addNotification(
                    t.error,
                    lang === "es"
                        ? "No se pudo exportar. Intenta con otro navegador."
                        : "Unable to export. Please try on a different browser.",
                    "error"
                );
            }
        }
    }

    async function handleShareInviteLink() {
        if (!user) return;
        const link = `${window.location.origin}/connect/${user.uid}`;
        const text = lang === 'es'
            ? `Hola 👋 Únete a mí en VitaMyStory para preservar memorias en familia: ${link}`
            : `Hey 👋 Join me on VitaMyStory to preserve family memories together: ${link}`;
        if (navigator.share) {
            await navigator.share({ title: 'VitaMyStory', text, url: link }).catch(() => {});
        } else {
            await navigator.clipboard.writeText(link);
            setInviteLinkCopied(true);
            setTimeout(() => setInviteLinkCopied(false), 3000);
        }
    }

    if (!isHydrated) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F6] dark:bg-midnight-950 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg mx-auto font-sans">
                <div className="p-6 pt-20 space-y-8">

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
                                        className="w-full bg-transparent border-b-2 border-stone-900 dark:border-stone-100 px-0 py-1 text-xl sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none transition-all"
                                    />
                                    <button onClick={() => setIsEditingName(false)} className="absolute right-0 bottom-2 text-stone-900 dark:text-stone-100 p-1 hover:bg-stone-100 dark:hover:bg-midnight-800 rounded-full transition-colors">
                                        <FiCheck size={24} />
                                    </button>
                                </div>
                            ) : (
                                <div className="group flex items-baseline gap-3 cursor-pointer select-none" onClick={() => setIsEditingName(true)}>
                                    <h1 className={`text-xl sm:text-2xl md:text-3xl font-serif font-bold leading-tight ${userName ? "text-stone-900 dark:text-stone-100" : "text-stone-300 dark:text-stone-700"} break-words max-w-full`}>
                                        {userName || t.tapToName}
                                    </h1>
                                    <FiEdit2 size={18} className="text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors shrink-0 translate-y-1" />
                                </div>
                            )}

                            <div className="mt-2 space-y-1">
                                <p className="text-stone-500 dark:text-stone-400 text-sm font-medium tracking-wide font-sans">
                                    {authLoading
                                        ? <span className="inline-block w-36 h-3.5 bg-stone-200 dark:bg-stone-700 rounded-full animate-pulse" />
                                        : user ? user.email : t.guestMode
                                    }
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

                    {/* Contacts Card — only for signed-in users */}
                    {user && (
                        <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 p-8 space-y-5">
                            <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 pl-1">
                                {lang === 'es' ? 'Contactos' : 'Contacts'}
                            </label>

                            {/* Invite button */}
                            <button
                                onClick={handleShareInviteLink}
                                className="w-full py-4 px-6 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold text-sm hover:bg-stone-50 dark:hover:bg-midnight-800 transition-all flex items-center justify-center gap-3 group"
                            >
                                <FiUsers size={18} className="text-stone-400 dark:text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
                                <span>
                                    {inviteLinkCopied
                                        ? (lang === 'es' ? '✓ ¡Enlace copiado!' : '✓ Link copied!')
                                        : (lang === 'es' ? 'Compartir mi enlace de contacto' : 'Share my invite link')}
                                </span>
                            </button>

                            {/* Friends list */}
                            {friends.length > 0 ? (
                                <div className="space-y-2">
                                    {friends.map(friend => (
                                        <div key={friend.uid} className="flex items-center gap-3 bg-stone-50 dark:bg-midnight-950 rounded-2xl p-3">
                                            {friend.photoUrl ? (
                                                <img src={friend.photoUrl} alt={friend.displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 font-bold text-sm flex-shrink-0">
                                                    {friend.displayName?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                            )}
                                            <span className="flex-1 font-serif text-stone-900 dark:text-stone-100 text-sm truncate">{friend.displayName}</span>
                                            <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">✓ {lang === 'es' ? 'Conectado' : 'Connected'}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-stone-400 dark:text-stone-600 font-serif italic text-center py-1">
                                    {lang === 'es' ? 'Comparte el enlace para conectar con alguien.' : 'Share the link above to connect with someone.'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Data & Collection Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 p-8 space-y-6">
                        <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 pl-1">{t.collection}</label>
                        <div className="space-y-4">
                            <button
                                onClick={() => setShowExportModal(true)}
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
                            <button
                                onClick={() => {
                                    const email = "hello@vitamystory.com";
                                    const mailto = `mailto:${email}?subject=VitaMyStory%20Feedback`;
                                    try {
                                        window.open(mailto, "_blank");
                                    } catch {
                                        navigator.clipboard?.writeText(email);
                                    }
                                }}
                                className="w-full py-4 rounded-2xl bg-stone-50 dark:bg-midnight-950 text-stone-900 dark:text-stone-100 font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-stone-100 dark:hover:bg-stone-900 transition-all flex items-center justify-center gap-3 border border-stone-100 dark:border-stone-800"
                            >
                                <FiMail size={16} />
                                <span>{t.contactBtn}</span>
                            </button>
                        </div>
                    </div>

                    {/* Auth & Exit */}
                    <div className="pt-4">
                        {authLoading ? (
                            // While auth resolves, show nothing to avoid guest-mode flash
                            <div className="w-full py-5 rounded-2xl bg-stone-100 dark:bg-midnight-900 animate-pulse" />
                        ) : user ? (
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

            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                person={activePerson}
                memories={activePerson?.memories ?? []}
                lang={lang}
                userName={userName}
                hasPurchasedBook={hasPurchasedBook}
                onDownloadBackup={downloadBackup}
            />
        </div>
    );
}
