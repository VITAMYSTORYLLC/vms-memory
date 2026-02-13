"use client";

import { useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Person } from "../types";

export function useSync(people: Person[], setPeople: (p: Person[]) => void) {
    const { user } = useAuth();

    // Safety flag to prevent infinite loops:
    // If we just received data from the cloud, we don't want to immediately save it back.
    const isReceivingUpdate = useRef(false);

    // 1. Downloading data (Real-time Listener)
    useEffect(() => {
        if (!user) return;

        const docRef = doc(db, "users", user.uid);

        // Listen for changes on the server
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.people && Array.isArray(data.people)) {
                    // Compare? Or just overwrite?
                    // For now, overwrite local state with server state.
                    // IMPORTANT: Set flag so we don't trigger the save effect below
                    isReceivingUpdate.current = true;
                    setPeople(data.people);

                    // Reset flag after a short delay (allows React to render)
                    setTimeout(() => {
                        isReceivingUpdate.current = false;
                    }, 500);
                }
            } else {
                // If doc doesn't exist yet, we might want to create it with current state
                // handled by the save effect below
            }
        }, (error) => {
            console.error("Sync Error:", error);
        });

        return () => unsubscribe();
    }, [user, setPeople]);

    // 2. Uploading data when people change
    useEffect(() => {
        if (!user) return;

        // If this change was caused by a cloud update, DO NOT save back to cloud.
        if (isReceivingUpdate.current) return;

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
        }, 2000); // 2 second debounce

        return () => clearTimeout(timeoutId);
    }, [people, user]);

    return null;
}
