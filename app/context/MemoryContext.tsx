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
    plural
} from "../utils";
import { TEXT, LS } from "../constants";
import { useAuth } from "../hooks/useAuth";
import LandingScreen from "../components/LandingScreen";

interface MemoryContextType {
    // State
    people: Person[];
    setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
    activePersonId: string;
    setActivePersonId: (id: string) => void;
    lang: Lang;
    setLang: (lang: Lang) => void;
    isHydrated: boolean;

    // Derived
    activePerson: Person | null;
    activeMemories: MemoryItem[];
    t: typeof TEXT["en"];

    // Drafts (Global so they persist on nav change)
    storyDraft: string;
    setStoryDraft: React.Dispatch<React.SetStateAction<string>>;
    imageDraft: string;
    setImageDraft: React.Dispatch<React.SetStateAction<string>>;
    nameDraft: string;
    setNameDraft: React.Dispatch<React.SetStateAction<string>>;
    inspiration: string | null;
    setInspiration: React.Dispatch<React.SetStateAction<string | null>>;

    // Editing
    editingId: string | null;
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
    editingPrompt: string;
    setEditingPrompt: React.Dispatch<React.SetStateAction<string>>;

    // Actions
    // Actions
    saveStory: (promptToSave: string) => Promise<string | null>;
    deleteMemory: (memoryId: string) => void;
    startNewPerson: () => void;
    resetApp: () => void;
    refreshState: () => void; // Force update if needed

    // Onboarding
    isOnboarded: boolean;
    completeOnboarding: () => void;

    // Display Name
    userName: string;
    setUserName: React.Dispatch<React.SetStateAction<string>>;

    // Auth
    user: any;
    handleLogout: () => Promise<void>;

    // Notifications
    notifications: Notification[];
    addNotification: (title: string, message: string, type?: NotificationType) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        type: "info",
        title: "Welcome to Alpha 1.0",
        message: "Thanks for being an early tester! Your feedback helps us shape the future of family memories.",
        date: Date.now() - 1000 * 60 * 60 * 2,
        read: false
    },
    {
        id: "2",
        type: "success",
        title: "Profile Updated",
        message: "You can now customize your profile picture and display name in the Profile tab.",
        date: Date.now() - 1000 * 60 * 60 * 24,
        read: false
    },
    {
        id: "3",
        type: "feature",
        title: "Coming Soon: Sharing",
        message: "We're working on ways to let you share these stories with your family. Stay tuned!",
        date: Date.now() - 1000 * 60 * 60 * 48,
        read: true
    }
];

export function MemoryProvider({ children }: { children: React.ReactNode }) {
    // --- State Initialization ---
    const [isHydrated, setIsHydrated] = useState(false);
    const [people, setPeople] = useState<Person[]>([]);
    const [activePersonId, setActivePersonId] = useState<string>("");
    const [lang, setLang] = useState<Lang>("en");

    // Drafts
    const [nameDraft, setNameDraft] = useState("");
    const [storyDraft, setStoryDraft] = useState("");
    const [imageDraft, setImageDraft] = useState<string>("");
    const [inspiration, setInspiration] = useState<string | null>(null);

    // Editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<string>("");

    const activePerson = useMemo(() => people.find((p) => p.id === activePersonId) || null, [people, activePersonId]);
    const activeMemories = activePerson?.memories ?? [];
    const t = TEXT[lang];

    const { user, signOut } = useAuth();

    const suppressAutoSelectRef = useRef(false);
    const autosaveTimer = useRef<number | null>(null);

    // Onboarding
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [userName, setUserName] = useState("");

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);

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
    useEffect(() => { if (isHydrated) saveJSON(LS.people, people); }, [people, isHydrated]);
    useEffect(() => { if (isHydrated) saveString(LS.activePersonId, activePersonId); }, [activePersonId, isHydrated]);
    useEffect(() => { if (isHydrated) saveString(LS.lang, lang); }, [lang, isHydrated]);
    useEffect(() => { if (isHydrated) saveString("vms_onboarded", String(isOnboarded)); }, [isOnboarded, isHydrated]);
    useEffect(() => { if (isHydrated) saveString("vms_user_name", userName); }, [userName, isHydrated]);
    useEffect(() => { if (isHydrated) saveString("vms_notifications", JSON.stringify(notifications)); }, [notifications, isHydrated]);

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
        const key = `${LS.draftPrefix}${activePersonId}`;
        if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

        autosaveTimer.current = window.setTimeout(() => {
            const val = storyDraft;
            if (!normalize(val)) removeKey(key);
            else saveString(key, val);
        }, 350);
        return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
    }, [storyDraft, activePersonId, editingId]);

    // Restore Draft on Switch
    useEffect(() => {
        if (!activePersonId) return;
        const key = `${LS.draftPrefix}${activePersonId}`;
        const saved = loadString(key);
        // Only restore if we don't have a current draft (or maybe we should overwrite? Use caution)
        // Current logic: if empty, try restore
        if (saved && !normalize(storyDraft) && !editingId) setStoryDraft(saved);
    }, [activePersonId, editingId, storyDraft]); // Added storyDraft dep to be safe, but logic checks if empty

    // --- Actions ---

    function startNewPerson() {
        suppressAutoSelectRef.current = true;
        setActivePersonId("");
        setNameDraft("");
        setStoryDraft("");
        setImageDraft("");
        setInspiration(null);
        setEditingId(null);
        setEditingPrompt("");
    }

    function deleteMemory(memoryId: string) {
        if (!activePersonId) return;
        setPeople((prev) => prev.map((p) => {
            if (p.id !== activePersonId) return p;
            return { ...p, memories: p.memories.filter((m) => m.id !== memoryId) };
        }));
    }

    function completeOnboarding() {
        setIsOnboarded(true);
    }

    function resetApp() {
        if (!canUseStorage()) {
            setPeople([]); setActivePersonId(""); setNameDraft(""); setStoryDraft("");
            setEditingId(null); setEditingPrompt(""); setIsOnboarded(false);
            return;
        }
        try {
            window.localStorage.removeItem(LS.people);
            window.localStorage.removeItem(LS.activePersonId);
            window.localStorage.removeItem(LS.questionState);
            window.localStorage.removeItem("vms_onboarded");
            window.localStorage.removeItem("vms_user_name");
            window.localStorage.removeItem("vms_user_photo");
            window.localStorage.removeItem("vms_notifications");
            const prefixes = [LS.draftPrefix, LS.usedPrefix, LS.badgesPrefix];
            const keysToRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (k && prefixes.some((p) => k.startsWith(p))) keysToRemove.push(k);
            }
            keysToRemove.forEach((k) => window.localStorage.removeItem(k));
        } catch { }
        suppressAutoSelectRef.current = true;
        setPeople([]); setActivePersonId(""); setNameDraft(""); setStoryDraft("");
        setImageDraft(""); setInspiration(null); setEditingId(null); setEditingPrompt("");
        setIsOnboarded(false); setUserName(""); setNotifications([]);
    }

    async function handleLogout() {
        await signOut();
        setPeople([]);
        setActivePersonId("");
        setNameDraft("");
        setStoryDraft("");
        setImageDraft("");
    }

    // Notifications Actions
    function addNotification(title: string, message: string, type: NotificationType = "info") {
        const newNote: Notification = {
            id: makeId(),
            title,
            message,
            type,
            date: Date.now(),
            read: false
        };
        setNotifications(prev => [newNote, ...prev]);
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
    async function saveStory(promptToSave: string): Promise<string | null> {
        const text = normalize(storyDraft);
        if (!text && !imageDraft) return null;

        // We removed the artificial delay here; components can handle UI loading state if they want

        if (editingId && activePerson) {
            setPeople((prev) => prev.map((p) => (p.id !== activePerson.id ? p : {
                ...p,
                memories: p.memories.map((m) => m.id === editingId ? { ...m, text: text, imageUrl: imageDraft } : m)
            })));
            const id = activePerson.id;
            setEditingId(null); setEditingPrompt(""); setStoryDraft(""); setImageDraft("");
            return id;
        }

        if (activePerson) {
            // Note: "markCurrentQuestionUsed" logic relies on specific question index which might be local to the Home page.
            // However, we can handle the data update here.
            // The calling component should handle the "Question Index" advancement.

            setPeople((prev) => prev.map((p) => p.id === activePerson.id ? {
                ...p,
                memories: addMemory(p.memories, promptToSave, storyDraft, undefined, imageDraft)
            } : p));

            removeKey(`${LS.draftPrefix}${activePerson.id}`);
            const id = activePerson.id;
            setStoryDraft(""); setImageDraft(""); setInspiration(null);
            return id;
        }

        // New Person
        const normalizedName = normalize(nameDraft);
        if (!normalizedName) return null;

        const p: Person = {
            id: makeId(),
            name: normalizedName,
            memories: addMemory([], promptToSave, storyDraft, undefined, imageDraft),
            createdAt: Date.now()
        };

        setPeople((prev) => [p, ...prev]);
        setActivePersonId(p.id);

        // Note: The "Used Question" logic for new person needs to happen, but we don't have access to current question index here easily 
        // without lifting that too. 
        // Ideally, the caller handles `saveUsedQuestionIndexes` since it knows the question index.

        removeKey(`${LS.draftPrefix}${p.id}`);
        setNameDraft(""); setStoryDraft(""); setImageDraft(""); setInspiration(null);
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
            activePerson,
            activeMemories,
            t,
            storyDraft, setStoryDraft,
            imageDraft, setImageDraft,
            nameDraft, setNameDraft,
            inspiration, setInspiration,
            editingId, setEditingId,
            editingPrompt, setEditingPrompt,
            saveStory,
            deleteMemory,
            startNewPerson,

            resetApp,
            refreshState,
            user,
            handleLogout,
            isOnboarded,
            completeOnboarding,
            userName,
            setUserName,

            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification
        }}>
            {!isHydrated ? <div className="min-h-screen bg-[#F9F8F6]" /> : !isOnboarded ? <LandingScreen /> : children}
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
