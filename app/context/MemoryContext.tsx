"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
import { Person, Lang, LastSaved, MemoryItem, Notification, NotificationType } from "../types";
import {
    loadJSON,
    saveJSON,
    loadString,
    saveString,
    removeKey,
    currentWeekNumber,
    addMemory,
    normalize,
    makeId,
    canUseStorage,
    loadUsedQuestionIndexes,
    saveUsedQuestionIndexes,
    nextUnusedIndex,
    wrapIndex,
    hasBadge,
    addBadge,
    plural,
    base64ToBlob
} from "../utils";
import { uploadImage } from "../utils/storage"; // Import storage utility
import { TEXT, LS } from "../constants";
import { useAuth } from "../hooks/useAuth";
import { useSync } from "../hooks/useSync";
import LandingScreen from "../components/LandingScreen";
import Toast from "../components/Toast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { type MilestoneData } from "../components/MilestoneCelebration";

interface ToastMessage {
    title: string;
    message: string;
    type: NotificationType;
}

interface MemoryContextType {
    // State
    people: Person[];
    setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
    activePersonId: string;
    setActivePersonId: (id: string) => void;
    lang: Lang;
    setLang: (lang: Lang) => void;
    isHydrated: boolean;
    theme: "light" | "dark";
    setTheme: (theme: "light" | "dark") => void;

    // Derived
    activePerson: Person | null;
    activeMemories: MemoryItem[];
    pendingMemories: MemoryItem[];
    t: typeof TEXT["en"];

    // Drafts (Global so they persist on nav change)
    storyDraft: string;
    setStoryDraft: React.Dispatch<React.SetStateAction<string>>;
    imageDraft: string;
    setImageDraft: React.Dispatch<React.SetStateAction<string>>;
    audioDraft: Blob | null;
    setAudioDraft: React.Dispatch<React.SetStateAction<Blob | null>>;
    nameDraft: string;
    setNameDraft: React.Dispatch<React.SetStateAction<string>>;
    inspiration: string | null;
    setInspiration: React.Dispatch<React.SetStateAction<string | null>>;
    draftKey: string;
    setDraftKey: (key: string) => void;
    isPhotoMode: boolean;
    setIsPhotoMode: React.Dispatch<React.SetStateAction<boolean>>;
    isAudioMode: boolean;
    setIsAudioMode: React.Dispatch<React.SetStateAction<boolean>>;
    isCustomMode: boolean;
    setIsCustomMode: React.Dispatch<React.SetStateAction<boolean>>;
    isAIMode: boolean;
    setIsAIMode: React.Dispatch<React.SetStateAction<boolean>>;
    isAskMode: boolean;
    setIsAskMode: React.Dispatch<React.SetStateAction<boolean>>;
    aiCurrentQuestionIndex: number;
    setAICurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;

    // Editing
    editingId: string | null;
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
    editingPrompt: string;
    setEditingPrompt: React.Dispatch<React.SetStateAction<string>>;

    // Actions
    saveStory: (promptToSave: string, questionId?: string) => Promise<string | null>;
    deleteMemory: (memoryId: string) => void;
    deletePerson: (personId: string) => void;
    updatePersonName: (personId: string, newName: string) => void;
    updatePersonPhoto: (personId: string, newPhotoUrl: string) => void;
    generateAIQuestions: (personId: string) => Promise<void>;
    startNewPerson: () => void;
    resetApp: () => void;
    refreshState: () => void; // Force update if needed

    // Onboarding
    isOnboarded: boolean;
    completeOnboarding: () => void;

    // Display Name
    userName: string;
    setUserName: React.Dispatch<React.SetStateAction<string>>;
    userPhoto: string;
    setUserPhoto: React.Dispatch<React.SetStateAction<string>>;

    // Auth
    user: any;
    handleLogout: () => Promise<void>;

    // Notifications
    notifications: Notification[];
    addNotification: (title: string, message: string, type?: NotificationType, translationData?: any) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;

    // Toast
    activeToast: ToastMessage | null;
    hideToast: () => void;

    // Milestone
    pendingMilestone: MilestoneData | null;
    dismissMilestone: () => void;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: Notification[] = [];

export function MemoryProvider({ children }: { children: React.ReactNode }) {
    // --- State Initialization ---
    const [isHydrated, setIsHydrated] = useState(false);
    const [people, setPeople] = useState<Person[]>([]);
    const [activePersonId, setActivePersonId] = useState<string>("");
    const [lang, setLang] = useState<Lang>("en");
    const [theme, setTheme] = useState<"light" | "dark">("light");

    // Drafts
    const [nameDraft, setNameDraft] = useState("");
    const [storyDraft, setStoryDraft] = useState("");
    const [imageDraft, setImageDraft] = useState<string>("");
    const [audioDraft, setAudioDraft] = useState<Blob | null>(null);
    const [isPhotoMode, setIsPhotoMode] = useState(false);
    const [isAudioMode, setIsAudioMode] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [isAIMode, setIsAIMode] = useState(false);
    const [isAskMode, setIsAskMode] = useState(false);
    const [aiCurrentQuestionIndex, setAICurrentQuestionIndex] = useState(0);
    const [draftKey, setDraftKey] = useState("default");
    const [inspiration, setInspiration] = useState<string | null>(null);

    // Editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<string>("");

    // Toast
    const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

    // Milestones
    const [pendingMilestone, setPendingMilestone] = useState<MilestoneData | null>(null);
    const milestoneQueueRef = useRef<MilestoneData[]>([]);
    function enqueueMilestone(m: MilestoneData) {
        // If none showing, show immediately; otherwise queue it
        if (!pendingMilestone) {
            setPendingMilestone(m);
        } else {
            milestoneQueueRef.current.push(m);
        }
    }
    function dismissMilestone() {
        const next = milestoneQueueRef.current.shift();
        setPendingMilestone(next || null);
    }

    const activePerson = useMemo(() => people.find((p) => p.id === activePersonId) || null, [people, activePersonId]);
    const activeMemories = useMemo(() => activePerson?.memories.filter((m) => m.status !== 'pending') ?? [], [activePerson]);
    const pendingMemories = useMemo(() => activePerson?.memories.filter((m) => m.status === 'pending') ?? [], [activePerson]);
    const t = TEXT[lang];

    const { user, signOut } = useAuth();

    const suppressAutoSelectRef = useRef(false);
    const autosaveTimer = useRef<number | null>(null);

    // Onboarding
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [userName, setUserName] = useState("");
    const [userPhoto, setUserPhoto] = useState("");

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // --- SYNC HOOK ---
    useSync(people, setPeople, userName, setUserName, userPhoto, setUserPhoto);

    // --- PUSH NOTIFICATIONS ---
    usePushNotifications(user?.uid || null);

    // --- Hydration ---
    useEffect(() => {
        const loadedLang = loadString(LS.lang);
        if (loadedLang === "en" || loadedLang === "es") setLang(loadedLang);

        const loadedPeople = loadJSON<Person[]>(LS.people);
        setPeople(Array.isArray(loadedPeople) ? loadedPeople : []);

        const storedActiveId = loadString(LS.activePersonId);
        setActivePersonId(storedActiveId);

        const onboarded = loadString("vms_onboarded") === "true";
        setIsOnboarded(onboarded);

        const storedName = loadString("vms_user_name");
        if (storedName) setUserName(storedName);

        const storedTheme = loadString("vms_theme");
        if (storedTheme === "light" || storedTheme === "dark") {
            setTheme(storedTheme);
        }

        // Load notifications
        try {
            const storedNotes = window.localStorage.getItem("vms_notifications");
            if (storedNotes) {
                setNotifications(JSON.parse(storedNotes));
            } else {
                setNotifications(INITIAL_NOTIFICATIONS);
                window.localStorage.setItem("vms_notifications", JSON.stringify(INITIAL_NOTIFICATIONS));
            }
        } catch (e) {
            setNotifications(INITIAL_NOTIFICATIONS);
        }

        setIsHydrated(true);
    }, []);

    // --- Persistence Effects ---
    useEffect(() => {
        if (!isHydrated) return;
        saveJSON(LS.people, people);
        saveString(LS.activePersonId, activePersonId);
        saveString(LS.lang, lang);
        saveString("vms_onboarded", String(isOnboarded));
        saveString("vms_user_name", userName);
        saveString("vms_notifications", JSON.stringify(notifications));
        saveString("vms_theme", theme);
    }, [people, activePersonId, lang, isOnboarded, userName, notifications, theme, isHydrated]);

    // --- theme sync (aggressive) ---
    useEffect(() => {
        if (typeof window === "undefined") return;
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme, isHydrated]);


    // Welcome Notification (Guest & User)
    useEffect(() => {
        if (!isHydrated) return;
        // Use a device-wide key so even guests see it once
        const key = "vms_device_welcome_shown";
        if (loadString(key) !== "true") {
            // Need to wrap in timer to ensure Translation is ready and hydration settled
            setTimeout(() => {
                addNotification(t.notificationWelcomeTitle, t.notificationWelcomeBody, "success", { titleKey: "notificationWelcomeTitle", bodyKey: "notificationWelcomeBody" });
                saveString(key, "true");
            }, 1000);
        }
    }, [isHydrated, t]);

    // Auto-select person logic
    useEffect(() => {
        if (people.length === 0) {
            if (isHydrated && activePersonId) setActivePersonId("");
            return;
        }
        if (suppressAutoSelectRef.current) {
            suppressAutoSelectRef.current = false;
            return;
        }
        if (!activePersonId || !people.some((p) => p.id === activePersonId)) {
            setActivePersonId(people[0].id);
        }
    }, [people, activePersonId, isHydrated]);

    // Autosave Draft
    useEffect(() => {
        if (!activePersonId || typeof window === "undefined" || editingId) return;
        const key = `${LS.draftPrefix}${activePersonId}_${draftKey}`;
        if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

        autosaveTimer.current = window.setTimeout(() => {
            const val = JSON.stringify({ text: storyDraft, image: imageDraft });
            if (!normalize(storyDraft) && !imageDraft) removeKey(key);
            else saveString(key, val);
        }, 350);
        return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
    }, [storyDraft, imageDraft, activePersonId, editingId, draftKey]);

    // Restore Draft on Switch
    useEffect(() => {
        if (!activePersonId || editingId) return;

        // First, immediately clear the current draft state to prevent text bleeding between questions
        setStoryDraft("");
        setImageDraft("");
        setAudioDraft(null);

        // Then, restore the saved draft for this specific question (if any)
        const key = `${LS.draftPrefix}${activePersonId}_${draftKey}`;
        const savedRaw = loadString(key);
        if (savedRaw) {
            try {
                const { text, image } = JSON.parse(savedRaw);
                setStoryDraft(text || "");
                setImageDraft(image || "");
            } catch (e) {
                // Fallback for old simple string drafts
                setStoryDraft(savedRaw);
                setImageDraft("");
            }
        }
    }, [activePersonId, draftKey, editingId]);

    // --- Actions ---

    function startNewPerson() {
        suppressAutoSelectRef.current = true;
        setActivePersonId("");
        setNameDraft("");
        setStoryDraft("");
        setImageDraft("");
        setAudioDraft(null);
        setInspiration(null);
        setEditingId(null);
        setEditingPrompt("");
        // Reset all modes to ensure starter questions appear
        setIsCustomMode(false);
        setIsPhotoMode(false);
        setIsAudioMode(false);
        setIsAIMode(false);
    }

    function deleteMemory(memoryId: string) {
        if (!activePersonId) return;
        setPeople((prev) => prev.map((p) => {
            if (p.id !== activePersonId) return p;
            return { ...p, memories: p.memories.filter((m) => m.id !== memoryId) };
        }));
    }

    function deletePerson(personId: string) {
        setPeople((prev) => prev.filter((p) => p.id !== personId));
        if (activePersonId === personId) {
            setActivePersonId("");
            setStoryDraft("");
            setImageDraft("");
            setAudioDraft(null);
        }
        removeKey(`${LS.draftPrefix}${personId}`);
        // Also clean up used questions if we wanted to go deep, but leaving them is safe enough
    }

    function updatePersonName(personId: string, newName: string) {
        setPeople((prev) => prev.map((p) => p.id === personId ? { ...p, name: newName } : p));
    }

    function updatePersonPhoto(personId: string, newPhotoUrl: string) {
        setPeople((prev) => prev.map((p) => p.id === personId ? { ...p, photoUrl: newPhotoUrl } : p));
    }

    async function generateAIQuestions(personId: string) {
        const person = people.find(p => p.id === personId);
        if (!person) return;

        try {
            // Import the AI function
            const { generatePersonalizedQuestions } = await import('../utils/ai');

            // Prepare story context
            const storyContext = person.memories.map(m => ({
                prompt: m.prompt,
                text: m.text
            }));

            // Generate 5 questions
            const questions = await generatePersonalizedQuestions(
                person.name,
                storyContext,
                lang,
                5
            );

            // Store questions and unlock timestamp
            setPeople((prev) => prev.map((p) =>
                p.id === personId
                    ? { ...p, aiQuestions: questions, aiQuestionsUnlockedAt: Date.now() }
                    : p
            ));

            // Show success notification
            addNotification(
                t.aiQuestionsUnlockedTitle,
                t.aiQuestionsUnlockedBody,
                "feature",
                { titleKey: "aiQuestionsUnlockedTitle", bodyKey: "aiQuestionsUnlockedBody" }
            );
        } catch (error) {
            console.error("Failed to generate AI questions:", error);
            addNotification(
                t.errorTitle || "Error",
                "Failed to generate AI questions. Please try again.",
                "error",
                { titleKey: "errorTitle" }
            );
        }
    }

    function completeOnboarding() {
        setIsOnboarded(true);
    }

    function resetApp() {
        if (!canUseStorage()) {
            setPeople([]); setActivePersonId(""); setNameDraft(""); setStoryDraft("");
            setEditingId(null); setEditingPrompt(""); setIsOnboarded(false);
            setAudioDraft(null);
            return;
        }
        try {
            // "Nuclear option" to ensure everything is wiped, as requested.
            window.localStorage.clear();
        } catch { }
        suppressAutoSelectRef.current = true;
        setPeople([]); setActivePersonId(""); setNameDraft(""); setStoryDraft("");
        setImageDraft(""); setAudioDraft(null); setInspiration(null); setEditingId(null); setEditingPrompt("");
        setIsOnboarded(false); setUserName(""); setNotifications(INITIAL_NOTIFICATIONS);
        setTheme("light");
    }

    async function handleLogout() {
        await signOut();
        setPeople([]);
        setActivePersonId("");
        setNameDraft("");
        setStoryDraft("");
        setImageDraft("");
        setAudioDraft(null);
        // Clear user profile data preventing it from persisting to the next user
        setUserName("");
        setUserPhoto("");
        // Remove from local storage explicitely just to be safe, 
        // though the useEffect should handle it when state updates.
        removeKey("vms_user_name");

        setIsOnboarded(false);
    }

    // Notifications Actions
    function addNotification(
        title: string,
        message: string,
        type: NotificationType = "info",
        translationData?: { titleKey?: string, bodyKey?: string, params?: any }
    ) {
        const newNote: Notification = {
            id: makeId(),
            title,
            message,
            type,
            date: Date.now(),
            read: false,
            translationData
        };
        setNotifications(prev => [newNote, ...prev]);
        setActiveToast({ title, message, type });
    }

    function hideToast() {
        setActiveToast(null);
    }

    function markAsRead(id: string) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }

    function markAllAsRead() {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }

    function deleteNotification(id: string) {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }

    // NOTE: saveStory logic is a bit tied to the "Question" state which is currently localized.
    // We might need to pass the "promptToSave" from component to here.
    async function saveStory(promptToSave: string, questionId?: string): Promise<string | null> {
        const text = normalize(storyDraft);
        // For new memories only — require some content. Edits can be title-only.
        if (!editingId && !text && !imageDraft && !audioDraft) return null;

        // --- IMAGE UPLOAD LOGIC ---
        let finalImageUrl = imageDraft;
        if (imageDraft && imageDraft.startsWith("data:image")) {
            try {
                // It's a base64 string, so we need to upload it
                const blob = base64ToBlob(imageDraft);
                const uid = user?.uid || "guest";
                const path = `users/${uid}/people/${activePersonId || "new"}/stories`;
                finalImageUrl = await uploadImage(blob, path);
            } catch (err) {
                console.error("Failed to upload image:", err);
                addNotification(t.errorTitle || "Error", "Failed to upload image. Please try again.", "error", { titleKey: "errorTitle" });
                return null;
            }
        }
        // --------------------------

        // --- AUDIO UPLOAD LOGIC ---
        let finalAudioUrl = "";
        if (audioDraft) {
            try {
                // Import uploadAudio just in time or assume it's available via closure scope if imported at top
                // Since this file is big, I'll rely on the import I added/will add at the top.
                // Wait, I need to add the import statement for uploadAudio at the top of the file!
                // I will add the import in a separate tool call if it's missing, but for now assuming it's imported or I will add it.
                // Ah, I cannot add imports easily in this block replacement. I will have to add it.
                // For now, let's use dynamic import to avoid breaking if I missed the top import.
                const { uploadAudio } = await import("../utils/storage");
                const uid = user?.uid || "guest";
                const path = `users/${uid}/people/${activePersonId || "new"}/audio`;
                finalAudioUrl = await uploadAudio(audioDraft, path);
            } catch (err) {
                console.error("Failed to upload audio:", err);
                addNotification(t.errorTitle || "Error", "Failed to upload audio. Please try again.", "error", { titleKey: "errorTitle" });
                return null;
            }
        }
        // --------------------------

        // We removed the artificial delay here; components can handle UI loading state if they want

        if (editingId && activePerson) {
            setPeople((prev) => prev.map((p) => (p.id !== activePerson.id ? p : {
                ...p,
                memories: p.memories.map((m) => m.id === editingId ? { ...m, prompt: promptToSave, text: text, imageUrl: finalImageUrl } : m)
            })));
            const id = activePerson.id;
            setEditingId(null); setEditingPrompt(""); setStoryDraft(""); setImageDraft(""); setAudioDraft(null);
            return id;
        }

        if (activePerson) {
            // Note: "markCurrentQuestionUsed" logic relies on specific question index which might be local to the Home page.
            // However, we can handle the data update here.
            // The calling component should handle the "Question Index" advancement.

            setPeople((prev) => prev.map((p) => {
                if (p.id !== activePerson.id) return p;
                const newMemories = addMemory(p.memories, promptToSave, storyDraft, undefined, finalImageUrl, questionId, isAudioMode, finalAudioUrl);
                const count = newMemories.length;

                // ---- Milestone definitions ----
                const STORY_MILESTONES: Array<{ count: number; id: string; icon: string; title: string; subtitle: string }> = [
                    { count: 1,   id: 'first_memory',    icon: '✨', title: 'First Memory',     subtitle: 'The journey begins' },
                    { count: 5,   id: 'story_keeper',    icon: '📗', title: 'Story Keeper',     subtitle: '5 memories preserved' },
                    { count: 10,  id: 'memory_maker',    icon: '🕯️', title: 'Memory Maker',     subtitle: '10 stories captured' },
                    { count: 25,  id: 'family_narrator', icon: '🖊️', title: 'Family Narrator',   subtitle: '25 memories alive' },
                    { count: 50,  id: 'chronicler',      icon: '📚', title: 'Chronicler',         subtitle: '50 stories preserved' },
                    { count: 100, id: 'legacy_guardian', icon: '🏛️', title: 'Legacy Guardian',   subtitle: '100 memories — a legacy' },
                ];

                for (const ms of STORY_MILESTONES) {
                    if (count === ms.count && !hasBadge(p.id, ms.id)) {
                        addBadge(p.id, ms.id);
                        enqueueMilestone({ id: ms.id, icon: ms.icon, title: ms.title, subtitle: ms.subtitle, color: '', personName: p.name });
                    }
                }

                // First audio story
                if (isAudioMode && finalAudioUrl && !hasBadge(p.id, 'voice_of_memory')) {
                    addBadge(p.id, 'voice_of_memory');
                    enqueueMilestone({ id: 'voice_of_memory', icon: '🎙️', title: 'Voice of Memory', subtitle: 'First audio story recorded', color: '', personName: p.name });
                }

                // First photo story
                if (finalImageUrl && !hasBadge(p.id, 'moment_in_time')) {
                    addBadge(p.id, 'moment_in_time');
                    enqueueMilestone({ id: 'moment_in_time', icon: '📷', title: 'Moment in Time', subtitle: 'First photo memory added', color: '', personName: p.name });
                }

                // First AI smart question answered
                if (isAIMode && !hasBadge(p.id, 'first_smart_question')) {
                    addBadge(p.id, 'first_smart_question');
                    enqueueMilestone({ id: 'first_smart_question', icon: '🤖', title: 'Deep Thinker', subtitle: 'First smart question answered', color: '', personName: p.name });
                }

                return { ...p, memories: newMemories };
            }));

            removeKey(`${LS.draftPrefix}${activePerson.id}_${draftKey}`);
            const id = activePerson.id;
            setStoryDraft(""); setImageDraft(""); setAudioDraft(null); setInspiration(null);
            return id;
        }

        // New Person
        const normalizedName = normalize(nameDraft);
        if (!normalizedName) return null;

        const p: Person = {
            id: makeId(),
            name: normalizedName,
            memories: addMemory([], promptToSave, storyDraft, undefined, finalImageUrl, questionId, isAudioMode, finalAudioUrl),
            createdAt: Date.now()
        };

        setPeople((prev) => [p, ...prev]);
        setActivePersonId(p.id);

        // Notify: Person Created
        addNotification(
            t.notificationPersonCreatedTitle,
            t.notificationPersonCreatedBody,
            "success",
            { titleKey: "notificationPersonCreatedTitle", bodyKey: "notificationPersonCreatedBody" }
        );

        // Note: The "Used Question" logic for new person needs to happen, but we don't have access to current question index here easily 
        // without lifting that too. 
        // Ideally, the caller handles `saveUsedQuestionIndexes` since it knows the question index.

        removeKey(`${LS.draftPrefix}${p.id}`);
        setNameDraft(""); setStoryDraft(""); setImageDraft(""); setAudioDraft(null); setInspiration(null);
        return p.id;
    }

    function refreshState() {
        // triggers a re-eval if needed
    }

    return (
        <MemoryContext.Provider value={{
            people, setPeople,
            activePersonId, setActivePersonId,
            lang, setLang,
            isHydrated,
            userName, setUserName,
            userPhoto, setUserPhoto,
            activePerson,
            activeMemories,
            pendingMemories,
            t,
            storyDraft, setStoryDraft,
            imageDraft, setImageDraft,
            audioDraft, setAudioDraft, // Exporting audio draft state
            nameDraft, setNameDraft,
            inspiration, setInspiration,
            draftKey, setDraftKey,
            isPhotoMode, setIsPhotoMode,
            isAudioMode, setIsAudioMode,
            isCustomMode, setIsCustomMode,
            isAIMode, setIsAIMode,
            isAskMode, setIsAskMode,
            aiCurrentQuestionIndex, setAICurrentQuestionIndex,
            editingId, setEditingId,
            editingPrompt, setEditingPrompt,
            saveStory,
            deleteMemory,
            deletePerson,
            updatePersonName,
            updatePersonPhoto,
            generateAIQuestions,
            startNewPerson,

            resetApp,
            refreshState,
            user,
            handleLogout,
            isOnboarded,
            completeOnboarding,

            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            theme,
            setTheme,
            activeToast,
            hideToast,
            pendingMilestone,
            dismissMilestone,
        }}>
            {!isHydrated ? <div className="min-h-screen bg-[#F9F8F6]" /> : !isOnboarded ? <LandingScreen /> : (
                <>
                    {children}
                    <Toast />
                </>
            )}
        </MemoryContext.Provider>
    );
}

export function useMemory() {
    const context = useContext(MemoryContext);
    if (context === undefined) {
        throw new Error("useMemory must be used within a MemoryProvider");
    }
    return context;
}
