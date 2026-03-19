"use client";

import React, { useState, useEffect } from "react";
import { useMemory } from "../context/MemoryContext";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import { compressImage, loadBadges } from "../utils";
import { uploadImage } from "../utils/storage";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { useRouter } from "next/navigation";
import { FiCamera, FiEdit2, FiCheck, FiLogOut, FiDownload, FiTrash2, FiUser, FiMail, FiUsers, FiLock } from "react-icons/fi";
import ExportModal from "../components/ExportModal";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useFriends } from "../hooks/useFriends";

// All possible badges in order
const ALL_BADGES = [
    { id: 'first_memory',        icon: '✨', name: 'First Memory',     nameEs: 'Primer Recuerdo' },
    { id: 'story_keeper',        icon: '📗', name: 'Story Keeper',     nameEs: 'Guardián' },
    { id: 'memory_maker',        icon: '🕯️', name: 'Memory Maker',     nameEs: 'Creador' },
    { id: 'voice_of_memory',     icon: '🎙️', name: 'Voice of Memory',  nameEs: 'Voz del Recuerdo' },
    { id: 'moment_in_time',      icon: '📷', name: 'Moment in Time',   nameEs: 'Momento Captado' },
    { id: 'first_smart_question',icon: '🤖', name: 'Deep Thinker',     nameEs: 'Pensador Profundo' },
    { id: 'family_narrator',     icon: '🖊️', name: 'Family Narrator',  nameEs: 'Narrador Familiar' },
    { id: 'chronicler',          icon: '📚', name: 'Chronicler',        nameEs: 'Cronista' },
    { id: 'legacy_guardian',     icon: '🏛️', name: 'Legacy Guardian',  nameEs: 'Guardián del Legado' },
];

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
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

    async function handleDeleteAccount() {
        if (!auth.currentUser) return;
        setIsDeleting(true);
        try {
            const { doc: fsDoc, deleteDoc } = await import("firebase/firestore");
            const { db } = await import("../lib/firebase");
            await deleteDoc(fsDoc(db, "users", auth.currentUser.uid)).catch(() => {});
            await deleteUser(auth.currentUser);
            resetApp();
            router.push("/");
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code;
            if (code === "auth/requires-recent-login") {
                addNotification(
                    lang === 'es' ? 'Sesión expirada' : 'Session expired',
                    lang === 'es'
                        ? 'Por seguridad, cierra sesión, vuelve a iniciar sesión y luego elimina tu cuenta.'
                        : 'For security, please sign out, sign back in, then delete your account.',
                    "error"
                );
            } else {
                addNotification(
                    lang === 'es' ? 'Error' : 'Error',
                    lang === 'es' ? 'No se pudo eliminar la cuenta.' : 'Could not delete account. Please try again.',
                    "error"
                );
            }
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
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

    // Derived stats for hero card
    const totalStories = people.reduce((sum, p) => sum + (p.memories?.filter(m => m.status !== 'pending').length ?? 0), 0);
    const totalPeople = people.length;
    const earliestDate = people.reduce((min, p) => (p.createdAt < min ? p.createdAt : min), people[0]?.createdAt ?? Date.now());
    const memberSinceYear = new Date(earliestDate).getFullYear();

    // Compute earned badges dynamically from actual memory data across ALL people.
    // This ensures badges show up even if the milestone event was never triggered.
    const allMemories = people.flatMap(p => p.memories?.filter(m => m.status !== 'pending') ?? []);
    const storedBadgeIds = new Set(people.flatMap(p => loadBadges(p.id)));
    const earnedBadgeIds = new Set<string>([
        ...storedBadgeIds,
        ...(allMemories.length >= 1  ? ['first_memory']         : []),
        ...(allMemories.length >= 5  ? ['story_keeper']         : []),
        ...(allMemories.length >= 10 ? ['memory_maker']         : []),
        ...(allMemories.length >= 25 ? ['family_narrator']      : []),
        ...(allMemories.length >= 50 ? ['chronicler']           : []),
        ...(allMemories.length >= 100? ['legacy_guardian']      : []),
        ...(allMemories.some(m => !!m.audioUrl) ? ['voice_of_memory']      : []),
        ...(allMemories.some(m => !!m.imageUrl) ? ['moment_in_time']       : []),
        ...(allMemories.some(m => !!m.questionId) ? ['first_smart_question'] : []),
    ]);

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F6] dark:bg-midnight-950 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg mx-auto font-sans">
                <div className="p-6 pt-14 space-y-6">

                    {/* ── Page Title ── */}
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif px-2">
                        {t.profileTitle}
                    </h1>

                    {/* ── Airbnb-style Hero Card ── */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 p-8">
                        <div className="flex items-center gap-6">
                            {/* Avatar */}
                            <div className="relative group shrink-0">
                                <input type="file" accept="image/*" className="hidden" id="profile-upload" onChange={handleImageUpload} />
                                <label htmlFor="profile-upload" className="block w-24 h-24 rounded-full overflow-hidden bg-stone-100 dark:bg-midnight-800 shadow-md border-4 border-white dark:border-midnight-700 cursor-pointer transition-all group-hover:scale-105 relative">
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                                            <FiUser size={40} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                        <FiCamera className="text-white drop-shadow" size={22} />
                                    </div>
                                </label>
                                {/* Camera badge */}
                                <label htmlFor="profile-upload" className="absolute -bottom-0.5 -right-0.5 w-8 h-8 bg-white dark:bg-midnight-800 rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-midnight-700 transition-colors z-10">
                                    <FiCamera size={13} className="text-stone-600 dark:text-stone-300" />
                                </label>
                            </div>

                            {/* Name & email */}
                            <div className="flex-1 min-w-0">
                                {isEditingName ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={userName}
                                            placeholder={t.tapToName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            onBlur={() => { if (userName.trim()) setIsEditingName(false); }}
                                            onKeyDown={(e) => { if (e.key === "Enter") setIsEditingName(false); }}
                                            className="w-full bg-transparent border-b-2 border-stone-900 dark:border-stone-100 py-1 text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 placeholder:text-stone-300 focus:outline-none"
                                        />
                                        <button onClick={() => setIsEditingName(false)} className="absolute right-0 bottom-2 text-stone-900 dark:text-stone-100 p-1 hover:bg-stone-100 dark:hover:bg-midnight-800 rounded-full">
                                            <FiCheck size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="group flex items-center gap-2 text-left w-full"
                                    >
                                        <span className={`text-2xl font-serif font-bold leading-tight ${userName ? 'text-stone-900 dark:text-stone-100' : 'text-stone-300 dark:text-stone-700'} truncate`}>
                                            {userName || t.tapToName}
                                        </span>
                                        <FiEdit2 size={14} className="text-stone-300 dark:text-stone-600 group-hover:text-stone-500 transition-colors shrink-0" />
                                    </button>
                                )}
                                <p className="text-sm text-stone-400 dark:text-stone-500 mt-1 truncate">
                                    {authLoading
                                        ? <span className="inline-block w-32 h-3 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse" />
                                        : totalPeople > 0
                                            ? (lang === 'es' ? `Miembro desde ${memberSinceYear}` : `Member since ${memberSinceYear}`)
                                            : <span className="font-bold uppercase tracking-wider text-xs">{t.guestMode}</span>
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="my-6 border-t border-stone-100 dark:border-stone-800" />

                        {/* Stats Row */}
                        <div className="flex items-center justify-around text-center">
                            <div className="flex-1">
                                <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif leading-none">{totalStories}</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-1">
                                    {lang === 'es' ? 'Recuerdos' : 'Stories'}
                                </p>
                            </div>
                            <div className="w-px h-10 bg-stone-200 dark:bg-stone-700" />
                            <div className="flex-1">
                                <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif leading-none">{totalPeople}</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-1">
                                    {lang === 'es' ? 'Familia' : 'Family'}
                                </p>
                            </div>
                            <div className="w-px h-10 bg-stone-200 dark:bg-stone-700" />
                            <div className="flex-1">
                                <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif leading-none">
                                    {earnedBadgeIds.size}
                                </p>
                                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-1">
                                    {lang === 'es' ? 'Logros' : 'Badges'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Achievements / Badges ── */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 py-8 pl-8 pr-0 overflow-hidden">
                        <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 pl-1">
                            {lang === 'es' ? 'Logros' : 'Achievements'}
                        </label>
                        <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth pr-8"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {ALL_BADGES.map(badge => {
                                const earned = earnedBadgeIds.has(badge.id);
                                return (
                                    <div
                                        key={badge.id}
                                        className={`relative flex-shrink-0 w-28 flex flex-col items-center justify-center gap-3 rounded-2xl py-5 px-2 text-center snap-start transition-all ${
                                            earned
                                                ? 'bg-stone-50 dark:bg-midnight-800 active:ring-2 active:ring-stone-300 dark:active:ring-stone-600'
                                                : 'bg-stone-50/50 dark:bg-midnight-950/50 opacity-40'
                                        }`}
                                    >
                                        {!earned && (
                                            <div className="absolute top-2 right-2">
                                                <FiLock size={10} className="text-stone-400 dark:text-stone-600" />
                                            </div>
                                        )}
                                        <span className={`text-4xl ${!earned ? 'grayscale' : ''}`} role="img">
                                            {badge.icon}
                                        </span>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-600 dark:text-stone-400 leading-tight">
                                            {lang === 'es' ? badge.nameEs : badge.name}
                                        </p>

                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-center text-[10px] text-stone-300 dark:text-stone-700 mt-3 mr-8 font-serif italic">
                            {earnedBadgeIds.size > 0
                                ? (lang === 'es' ? `${earnedBadgeIds.size} de ${ALL_BADGES.length} logros desbloqueados` : `${earnedBadgeIds.size} of ${ALL_BADGES.length} achievements unlocked`)
                                : (lang === 'es' ? 'Guarda recuerdos para desbloquear logros.' : 'Save memories to unlock achievements.')
                            }
                        </p>
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

                    {/* Preferences Card */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-sm border border-stone-100/50 dark:border-stone-800 overflow-hidden">
                        <div className="px-8 pt-7 pb-3">
                            <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600">
                                {lang === 'es' ? 'Preferencias' : 'Preferences'}
                            </label>
                        </div>

                        {/* Theme row */}
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="w-full flex items-center gap-4 px-8 py-4 hover:bg-stone-50 dark:hover:bg-midnight-800/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-midnight-800 flex items-center justify-center text-lg flex-shrink-0">
                                {theme === 'light' ? '☀️' : '🌙'}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                    {lang === 'es' ? 'Apariencia' : 'Appearance'}
                                </p>
                                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                                    {theme === 'light'
                                        ? (lang === 'es' ? 'Modo claro' : 'Light mode')
                                        : (lang === 'es' ? 'Modo oscuro' : 'Dark mode')}
                                </p>
                            </div>
                            {/* iOS-style toggle */}
                            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${theme === 'dark' ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-200 dark:bg-stone-700'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </div>
                        </button>

                        <div className="h-px bg-stone-100 dark:bg-stone-800 mx-8" />

                        {/* Language row */}
                        <div className="w-full flex items-center gap-4 px-8 py-4">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-midnight-800 flex items-center justify-center text-lg flex-shrink-0">
                                🌐
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                    {lang === 'es' ? 'Idioma' : 'Language'}
                                </p>
                                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                                    {lang === 'en' ? 'English' : 'Español'}
                                </p>
                            </div>
                            {/* Compact language chip */}
                            <div className="flex bg-stone-100 dark:bg-midnight-800 rounded-full p-0.5 flex-shrink-0">
                                <button
                                    onClick={() => setLang('en')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-400 dark:text-stone-500'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLang('es')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'es' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-400 dark:text-stone-500'}`}
                                >
                                    ES
                                </button>
                            </div>
                        </div>
                        <div className="pb-3" />
                    </div>


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
                    <div className="pt-4 space-y-3">
                        {authLoading ? (
                            // While auth resolves, show nothing to avoid guest-mode flash
                            <div className="w-full py-5 rounded-2xl bg-stone-100 dark:bg-midnight-900 animate-pulse" />
                        ) : user ? (
                            <>
                                <button
                                    onClick={() => { handleLogout(); router.push("/"); }}
                                    className="w-full py-5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold uppercase tracking-[0.2em] text-sm shadow-xl shadow-stone-200/50 dark:shadow-none hover:bg-stone-800 dark:hover:bg-white transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <FiLogOut size={18} />
                                    <span>{t.signOut}</span>
                                </button>
                                <button
                                    onClick={() => { setDeleteConfirmText(""); setShowDeleteModal(true); }}
                                    className="w-full py-3 text-red-400 hover:text-red-500 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                                >
                                    <FiTrash2 size={13} />
                                    <span>{lang === 'es' ? 'Eliminar cuenta' : 'Delete account'}</span>
                                </button>
                            </>
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

                        {/* Legal footer */}
                        <div className="text-center pt-8 pb-2 space-y-2">
                            <div className="flex items-center justify-center gap-3">
                                <a
                                    href="https://vitamystory.com/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-stone-400 dark:text-stone-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
                                >
                                    {lang === 'es' ? 'Privacidad' : 'Privacy Policy'}
                                </a>
                                <span className="text-stone-200 dark:text-stone-800">·</span>
                                <a
                                    href="https://vitamystory.com/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-stone-400 dark:text-stone-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
                                >
                                    {lang === 'es' ? 'Términos' : 'Terms'}
                                </a>
                            </div>
                            <p className="text-stone-300 dark:text-stone-700 text-[10px] font-bold uppercase tracking-[0.3em]">VitaMyStory © 2024 · v1.0</p>
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

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white dark:bg-midnight-900 rounded-[2rem] w-full max-w-md p-8 space-y-6 shadow-2xl">
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                                {lang === 'es' ? '¿Eliminar cuenta?' : 'Delete account?'}
                            </h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                                {lang === 'es'
                                    ? 'Todos tus recuerdos e historias se eliminarán permanentemente. Esta acción no se puede deshacer.'
                                    : 'All your memories and stories will be permanently deleted. This cannot be undone.'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                                {lang === 'es' ? 'Escribe ELIMINAR para confirmar' : 'Type DELETE to confirm'}
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={lang === 'es' ? 'ELIMINAR' : 'DELETE'}
                                className="w-full py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-midnight-950 text-stone-900 dark:text-stone-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 placeholder:text-stone-300 dark:placeholder:text-stone-700"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold text-sm hover:bg-stone-50 dark:hover:bg-midnight-800 transition-all"
                            >
                                {lang === 'es' ? 'Cancelar' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || (deleteConfirmText !== 'DELETE' && deleteConfirmText !== 'ELIMINAR')}
                                className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? '...' : (lang === 'es' ? 'Eliminar' : 'Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
