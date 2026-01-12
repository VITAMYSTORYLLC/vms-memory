"use client";

import { useState, useEffect } from "react";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    User,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { AuthUser } from "../types";

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signUp = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Registration failed";
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string): Promise<boolean> => {
        setError(null);
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Reset failed";
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async (): Promise<void> => {
        setError(null);
        try {
            await firebaseSignOut(auth);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Logout failed";
            setError(message);
        }
    };

    const clearError = () => setError(null);

    return {
        user,
        loading,
        error,
        signUp,
        signIn,
        resetPassword,
        signOut,
        clearError,
    };
}
