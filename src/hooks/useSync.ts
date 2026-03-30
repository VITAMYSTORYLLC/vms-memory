"use client";

import { useEffect, useRef } from "react";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { Person } from "@/types";

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
    // Tracks whether migration check has been done for the current user session
    const migrationDoneRef = useRef<string | null>(null);

    // 1. Guest migration + download data
    useEffect(() => {
        const uid = user?.uid;
        if (!uid) return;

        const docRef = doc(db, "users", uid);

        // Run migration check + stamp lastActiveAt once per user session
        if (migrationDoneRef.current !== uid) {
            migrationDoneRef.current = uid;

            (async () => {
                try {
                    const snap = await getDoc(docRef);
                    const cloudHasPeople =
                        snap.exists() &&
                        Array.isArray(snap.data()?.people) &&
                        snap.data()!.people.length > 0;

                    if (!cloudHasPeople && people.length > 0) {
                        // Guest has local data and cloud is empty — MIGRATE UP
                        console.log("[useSync] Migrating guest data to cloud:", people.length, "people");
                        await setDoc(docRef, {
                            people,
                            displayName: userName,
                            photoURL: userPhoto,
                            updatedAt: Date.now(),
                            migratedFromGuest: true,
                        }, { merge: true });
                        // Local state already has the right data, no need to call setPeople
                    }

                    // Stamp lastActiveAt so the daily reminder cron can detect inactivity
                    await setDoc(docRef, { lastActiveAt: Date.now() }, { merge: true });

                    // If cloud has data, the onSnapshot listener below will load it
                } catch (e) {
                    console.error("[useSync] Migration error:", e);
                }
            })();
        }

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                isReceivingUpdate.current = true;
                
                // Only overwrite local state if cloud actually has people
                if (data.people && Array.isArray(data.people) && data.people.length > 0) {
                    setPeople(data.people);
                }

                if (data.displayName) setUserName(data.displayName);
                if (data.photoURL) setUserPhoto(data.photoURL);

                setTimeout(() => { isReceivingUpdate.current = false; }, 500);
            }
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    // 2. Upload local state changes to cloud
    useEffect(() => {
        const uid = user?.uid;
        if (!uid) return;
        if (isReceivingUpdate.current) return;

        const timeoutId = setTimeout(async () => {
            try {
                const docRef = doc(db, "users", uid);
                await setDoc(docRef, {
                    people,
                    displayName: userName,
                    photoURL: userPhoto,
                    updatedAt: Date.now(),
                }, { merge: true });
            } catch (e) {
                console.error("[useSync] Error saving to cloud:", e);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [people, userName, userPhoto, user?.uid]);

    return null;
}
