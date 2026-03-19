"use client";

import { useEffect, useRef } from "react";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
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
    // When true, incoming Firestore snapshots are echo-backs of our own write — skip them.
    const suppressSnapshotRef = useRef(false);
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

        // Subscribe to real-time updates from OTHER devices / sessions.
        // We skip snapshots that are echo-backs of our own local writes.
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            // If we're suppressing (we just wrote), skip this snapshot entirely
            if (suppressSnapshotRef.current) return;

            if (docSnap.exists()) {
                const data = docSnap.data();

                // Only overwrite local state if cloud actually has people
                if (data.people && Array.isArray(data.people) && data.people.length > 0) {
                    setPeople(data.people);
                }

                if (data.displayName) setUserName(data.displayName);
                if (data.photoURL) setUserPhoto(data.photoURL);
            }
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    // 2. Upload local state changes to cloud
    useEffect(() => {
        const uid = user?.uid;
        if (!uid) return;

        const timeoutId = setTimeout(async () => {
            try {
                // Raise the suppress flag BEFORE writing so the echo-back snapshot
                // that Firestore sends to us is ignored and doesn't overwrite the
                // just-saved local state with stale cloud data.
                suppressSnapshotRef.current = true;

                const docRef = doc(db, "users", uid);
                await setDoc(docRef, {
                    people,
                    displayName: userName,
                    photoURL: userPhoto,
                    updatedAt: Date.now(),
                }, { merge: true });

                // Lower the flag after 5 seconds — enough time for the echo to arrive
                setTimeout(() => { suppressSnapshotRef.current = false; }, 5000);
            } catch (e) {
                suppressSnapshotRef.current = false;
                console.error("[useSync] Error saving to cloud:", e);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [people, userName, userPhoto, user?.uid]);

    return null;
}
