"use client";

import { useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Person } from "../types";

export function useSync(
    people: Person[],
    setPeople: (p: Person[]) => void,
    userName: string,
    setUserName: (n: string) => void,
    userPhoto: string,
    setUserPhoto: (u: string) => void
) {
    const { user } = useAuth();
    const isReceivingUpdate = useRef(false);

    // 1. Downloading data
    useEffect(() => {
        if (!user) return;

        const docRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                isReceivingUpdate.current = true;

                // Sync People
                if (data.people && Array.isArray(data.people)) {
                    setPeople(data.people);
                }

                // Sync Profile Data
                if (data.displayName) {
                    setUserName(data.displayName);
                }
                if (data.photoURL) {
                    setUserPhoto(data.photoURL);
                }

                setTimeout(() => {
                    isReceivingUpdate.current = false;
                }, 500);
            }
        });

        return () => unsubscribe();
    }, [user, setPeople, setUserName, setUserPhoto]);

    // 2. Uploading data
    useEffect(() => {
        if (!user) return;
        if (isReceivingUpdate.current) return;

        const timeoutId = setTimeout(async () => {
            try {
                const docRef = doc(db, "users", user.uid);
                await setDoc(docRef, {
                    people: people,
                    displayName: userName,
                    photoURL: userPhoto,
                    updatedAt: Date.now()
                }, { merge: true });
            } catch (e) {
                console.error("Error saving to cloud:", e);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [people, userName, userPhoto, user]);

    return null;
}
