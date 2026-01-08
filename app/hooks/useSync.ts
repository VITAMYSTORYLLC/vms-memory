"use client";

import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Person } from "../types";

export function useSync(people: Person[], setPeople: (p: Person[]) => void) {
    const { user } = useAuth();
    const isInitialLoad = useRef(true);

    // 1. Downloading data when user logs in
    useEffect(() => {
        async function loadData() {
            if (!user) {
                // Use local storage if no user (handled in page.tsx usually, or here if we moved logic)
                // But for sync, we only care if user exists.
                return;
            }

            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.people && Array.isArray(data.people)) {
                        // Merge strategy: Overwrite local with cloud for now to ensure consistency.
                        // You could do smarter merging later.
                        setPeople(data.people);
                    }
                } else {
                    // First time syncing? Maybe upload local data?
                    // For safety, let's just create the doc with current local data if it exists
                    if (people.length > 0) {
                        await setDoc(docRef, { people });
                    }
                }
            } catch (e) {
                console.error("Error loading data:", e);
            } finally {
                isInitialLoad.current = false;
            }
        }

        if (user) {
            loadData();
        }
    }, [user]); // Run only when user changes (login/out)

    // 2. Uploading data when people change
    useEffect(() => {
        // Don't save if it's the very first render and we haven't loaded yet
        // simple check: if user is null, we don't save to cloud
        if (!user) return;

        // We also want to avoid saving the "empty state" over cloud data during that split second of loading.
        // However, since people is state-managed, we rely on loadData setting it first.
        // A more robust way is debouncing.

        if (isInitialLoad.current) return;

        const timeoutId = setTimeout(async () => {
            try {
                const docRef = doc(db, "users", user.uid);
                await setDoc(docRef, {
                    people: people,
                    updatedAt: Date.now()
                }, { merge: true });
            } catch (e) {
                console.error("Error saving to cloud:", e);
            }
        }, 2000); // 2 second debounce to avoid too many writes

        return () => clearTimeout(timeoutId);
    }, [people, user]);

    return null; // This hook doesn't yield UI
}
