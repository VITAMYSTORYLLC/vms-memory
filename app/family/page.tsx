"use client";

import Image from "next/image";

import React, { useState } from "react";
import { useMemory } from "../context/MemoryContext";
import { PrimaryButton } from "../components/PrimaryButton";
import { SecondaryButton } from "../components/SecondaryButton";
import { useRouter } from "next/navigation";
import { plural, normalize } from "../utils";
import { renderWithBoldName } from "../utils/text";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { FiShare2, FiMoreVertical, FiEdit2, FiTrash2, FiX, FiCheck, FiCamera, FiUser } from "react-icons/fi";
import { compressImage } from "../utils";
import { uploadImage } from "../utils/storage";

export default function FamilyPage() {
    const {
        people,
        activePersonId,
        setActivePersonId,
        startNewPerson,
        deletePerson,
        updatePersonName,
        updatePersonPhoto,
        t,
        lang,
        setLang,
        nameDraft,
        setNameDraft,
        user,
        addNotification,
        theme
    } = useMemory();
    const router = useRouter();
    const { loading: authLoading, error: authError, signUp, signIn, signInWithGoogle, resetPassword, clearError } = useAuth();
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState("");
    const [uploadingForId, setUploadingForId] = useState<string | null>(null);
    const personFileInputRef = React.useRef<HTMLInputElement>(null);

    const [mode, setMode] = React.useState<"LIST" | "WELCOME" | "INTRO" | "login" | "register" | "reset">(
        people.length === 0 ? "WELCOME" : "LIST"
    );

    React.useEffect(() => {
        if (people.length === 0 && mode === "LIST") {
            setMode("WELCOME");
        }
    }, [people.length]);

    function handleSelect(id: string) {
        if (actionMenuOpen) {
            setActionMenuOpen(null);
            return;
        }
        setActivePersonId(id);

        const person = people.find(p => p.id === id);
        if (person && person.memories.length > 0) {
            router.push("/stories?random=true");
        } else {
            router.push("/");
        }
    }

    function handleStartCreating() {
        startNewPerson();
        setMode("WELCOME");
    }

    function toggleMenu(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        setActionMenuOpen(actionMenuOpen === id ? null : id);
    }

    function handleShare(e: React.MouseEvent, person: any) {
        e.stopPropagation();
        const shareText = t.shareMainMsg(person.name);
        // Build a deep link or just share text for now
        const url = window.location.origin;
        const fullText = `${shareText}\n${url}`;

        if (navigator.share) {
            navigator.share({
                title: "VitaMyStory",
                text: shareText,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(fullText);
            addNotification(t.storyShared, t.shareSuccess, "success");
        }
    }

    function handleDeleteClick(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        setActionMenuOpen(null);
        setDeletingId(id);
    }

    function confirmDelete() {
        if (deletingId) {
            deletePerson(deletingId);
            setDeletingId(null);
        }
    }

    function handleEditClick(e: React.MouseEvent, p: any) {
        e.stopPropagation();
        setActionMenuOpen(null);
        setEditingId(p.id);
        setEditNameValue(p.name);
    }

    function saveEditName() {
        if (editingId && normalize(editNameValue)) {
            updatePersonName(editingId, normalize(editNameValue));
            setEditingId(null);
            setEditNameValue("");
        }
    }

    function handlePhotoClick(e: React.MouseEvent, p: any) {
        e.stopPropagation();
        setActionMenuOpen(null);
        setUploadingForId(p.id);
        // Small timeout to allow state to settle before clicking input
        setTimeout(() => personFileInputRef.current?.click(), 100);
    }

    async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !uploadingForId || !user) return;

        try {
            // Optimistic update using local object URL (optional, but let's stick to simple upload first)
            // 1. Compress
            const compressedBase64 = await compressImage(file);

            // 2. Upload
            // We need to convert base64 back to blob for uploadImage, or use putString
            // But uploadImage takes a File/Blob.
            // Let's use the helper base64ToBlob if we have it, or just upload the file directly if compression isn't strictly enforced for storage size (though it should be).
            // Actually, compressImage returns base64. 
            // We can upload the base64 string using uploadString in firebase, but our utility might only handle Files?
            // Let's check imports. I didn't import base64ToBlob. I should added it.
            // For now, let's just upload the original file to keep it simple, or use the storage utility if it handles formatting.
            // Wait, previous turn showed `uploadImage` usage in ProfilePage: 
            // `const url = await uploadImage(user.uid, blob, "profile");`
            // So I need `base64ToBlob`.

            const res = await fetch(compressedBase64);
            const blob = await res.blob();

            // Corrected path and arguments
            const fullPath = `users/${user.uid}/people/${uploadingForId}/profile`;
            const downloadUrl = await uploadImage(blob, fullPath);

            if (downloadUrl) {
                updatePersonPhoto(uploadingForId, downloadUrl);
                addNotification(t.success, t.photoUpdated || "Photo updated", "success");
            }
        } catch (error) {
            console.error(error);
            addNotification(t.error, "Failed to upload photo", "error");
        }
        setUploadingForId(null);
        if (personFileInputRef.current) personFileInputRef.current.value = "";
    }

    if (mode === "LIST") {
        return (
            <div className={`min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-midnight-950 safe-top safe-bottom pb-24 transition-colors duration-500`}>
                <div className="w-full max-w-lg font-sans h-full sm:h-auto overflow-y-auto" onClick={() => setActionMenuOpen(null)}>
                    <div className="p-6 pt-12 pb-48">
                        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-8">{t.familyTitle}</h1>

                        <div className="space-y-4">
                            {people.map((p) => (
                                <div key={p.id} className="relative group">
                                    <div
                                        onClick={() => handleSelect(p.id)}
                                        className={`w-full text-left p-5 pr-14 rounded-2xl transition-all border cursor-pointer relative z-10 ${p.id === activePersonId ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-lg scale-[1.02]" : "bg-white dark:bg-midnight-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                {/* Person Photo */}
                                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-stone-100 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 flex-shrink-0">
                                                    {p.photoUrl ? (
                                                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600">
                                                            <FiUser size={32} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="text-2xl font-serif leading-none mb-2 font-bold pr-4">{p.name}</div>
                                                    <div className={`text-sm uppercase tracking-wider font-sans ${p.id === activePersonId ? "text-stone-400 dark:text-stone-500" : "text-stone-400 dark:text-stone-600 font-bold"}`}>
                                                        {p.memories.length} {plural(p.memories.length, lang === "es" ? "historia" : "story")}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Floating */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                                        <button
                                            onClick={(e) => toggleMenu(e, p.id)}
                                            className={`p-3 rounded-full hover:bg-stone-100 dark:hover:bg-midnight-800 transition-colors ${p.id === activePersonId ? "text-stone-400 dark:text-stone-500 hover:text-white dark:hover:text-stone-900" : "text-stone-400 dark:text-stone-600"}`}
                                        >
                                            <FiMoreVertical size={20} />
                                        </button>
                                    </div>

                                    {/* Dropdown Menu */}
                                    {actionMenuOpen === p.id && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-midnight-900 rounded-xl shadow-xl border border-stone-100 dark:border-stone-800 p-1 z-30 animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                onClick={(e) => handleShare(e, p)}
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-midnight-800 text-stone-700 dark:text-stone-300 text-sm font-bold flex items-center gap-3"
                                            >
                                                <FiShare2 size={16} /> {t.shareProfile}
                                            </button>
                                            <button
                                                onClick={(e) => handleEditClick(e, p)}
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-midnight-800 text-stone-700 dark:text-stone-300 text-sm font-bold flex items-center gap-3"
                                            >
                                                <FiEdit2 size={16} /> {t.editName}
                                            </button>
                                            <button
                                                onClick={(e) => handlePhotoClick(e, p)}
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-midnight-800 text-stone-700 dark:text-stone-300 text-sm font-bold flex items-center gap-3"
                                            >
                                                <FiCamera size={16} /> {lang === "es" ? "Cambiar foto" : "Change Photo"}
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, p.id)}
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-sm font-bold flex items-center gap-3"
                                            >
                                                <FiTrash2 size={16} /> {t.deleteProfile}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <PrimaryButton onClick={handleStartCreating}>
                                {t.newPerson}
                            </PrimaryButton>
                        </div>
                    </div>
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={personFileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*,.heic,.HEIC"
                        className="hidden"
                    />
                </div>

                {/* Edit Modal */}
                {editingId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-midnight-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-100 dark:border-stone-800">
                            <h3 className="text-xl font-bold font-serif mb-4 text-stone-900 dark:text-stone-100">{t.renameTitle}</h3>
                            <input
                                autoFocus
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                placeholder={t.renamePlaceholder}
                                className="w-full bg-stone-50 dark:bg-midnight-950 border-b-2 border-stone-200 dark:border-stone-800 p-3 text-lg font-serif mb-6 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors"
                            />
                            <div className="flex gap-3">
                                <SecondaryButton onClick={() => setEditingId(null)} className="flex-1 justify-center">{t.cancel}</SecondaryButton>
                                <PrimaryButton onClick={saveEditName} disabled={!normalize(editNameValue)} className="flex-1 justify-center">{t.renameSave}</PrimaryButton>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deletingId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-midnight-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-100 dark:border-stone-800 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                <FiTrash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold font-serif mb-2 text-stone-900 dark:text-stone-100">{t.deleteProfileConfirmTitle}</h3>
                            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 leading-relaxed">
                                {t.deleteProfileConfirmBody(people.find(p => p.id === deletingId)?.name || "")}
                            </p>
                            <div className="flex gap-3">
                                <SecondaryButton onClick={() => setDeletingId(null)} className="flex-1 justify-center">{t.cancel}</SecondaryButton>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-colors shadow-lg"
                                >
                                    {t.confirm}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // WELCOME / INTRO FLOW (Unchanged, but re-included for full file validity)
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-midnight-950 text-stone-900 dark:text-stone-100 safe-top safe-bottom pb-24 transition-colors duration-500">
            <div className="w-full max-w-lg sm:px-4 font-sans h-full sm:h-auto">
                <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex-1 flex flex-col overflow-hidden h-full">

                    {people.length > 0 && mode === "WELCOME" && (
                        <button onClick={() => setMode("LIST")} className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400 font-sans z-20">
                            ← {t.back}
                        </button>
                    )}

                    {mode === "WELCOME" && (
                        <div className="flex-1 flex flex-col justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-700 relative pb-12">

                            <div className="space-y-4">
                                <div className="flex justify-center mb-2">
                                    <Image
                                        src={theme === "dark" ? "/logo-white.png" : "/logo-transparent.png"}
                                        alt="VitaMyStory Logo"
                                        width={150}
                                        height={150}
                                        className="rounded-xl object-contain"
                                    />
                                </div>

                                <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed max-w-xs mx-auto font-serif italic">{t.welcomeBody}</p>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700 font-sans">{t.whoFor}</label>
                                    <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder={t.placeholder} className="w-full bg-transparent border-b-2 border-stone-100 dark:border-stone-800 p-2 text-center text-3xl font-serif text-stone-800 dark:text-stone-200 placeholder:text-stone-200 dark:placeholder:text-stone-600 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors" autoFocus />
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <PrimaryButton disabled={!normalize(nameDraft)} onClick={() => setMode("INTRO")}>{t.continue}</PrimaryButton>
                            </div>
                            {!user && (
                                <div className="mt-4 flex justify-center gap-4">
                                    <button onClick={() => setMode("login")} className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 underline font-sans">{t.login}</button>
                                    <button onClick={() => setMode("register")} className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 underline font-sans">{t.register}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "INTRO" && (
                        <div className="flex-1 flex flex-col justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-12">
                            <div className="space-y-8 px-6">
                                <div className="relative inline-block mx-auto mb-4">
                                    <div className="text-5xl animate-breathing">✍️</div>
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">{t.introTitle}</h2>
                                <div className="space-y-6">
                                    <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed whitespace-pre-line font-serif italic">{renderWithBoldName(t.introBody(nameDraft))}</p>
                                </div>
                            </div>
                            <div className="pt-6 px-4">
                                <PrimaryButton onClick={() => router.push("/")}>{t.startWriting}</PrimaryButton>
                            </div>
                        </div>
                    )}

                    {(mode === "login" || mode === "register" || mode === "reset") && (
                        <AuthModal
                            mode={mode}
                            lang={lang}
                            loading={authLoading}
                            error={authError}
                            onSubmit={async (email, password) => {
                                const success = mode === "login" ? await signIn(email, password) : await signUp(email, password);
                                if (success) setMode(people.length > 0 ? "LIST" : "WELCOME");
                            }}
                            onReset={resetPassword}
                            onToggleMode={(newMode) => setMode(newMode)}
                            onClose={() => setMode("WELCOME")}
                            onGoogleSignIn={async () => {
                                await signInWithGoogle();
                                setMode(people.length > 0 ? "LIST" : "WELCOME");
                            }}
                            onClearError={clearError}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
