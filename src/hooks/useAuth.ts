"use client";

import { useState, useEffect } from "react";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { AuthUser } from "@/types";


// Helper function to detect mobile devices
function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for redirect result first (for mobile Google Sign-In)
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    // User successfully signed in via redirect
                    console.log("Redirect sign-in successful");
                }
            })
            .catch((error) => {
                console.error("Redirect result error:", error);
                setError(error.message || "Sign-in failed after redirect");
            });

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
            if (firebaseUser) {
                const authUser: AuthUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                };
                setUser(authUser);

                // Upsert minimal public profile so contacts can discover this user
                setDoc(doc(db, 'users', firebaseUser.uid), {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'VitaMyStory User',
                    photoUrl: firebaseUser.photoURL || null,
                    email: firebaseUser.email || null,
                    createdAt: Date.now(),
                }, { merge: true }).catch(() => {}); // fire-and-forget, non-blocking
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
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

    const signInWithGoogle = async (): Promise<boolean> => {
        setError(null);
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();

            // Use redirect flow on mobile, popup on desktop
            if (isMobileDevice()) {
                // For mobile: redirect to Google sign-in
                await signInWithRedirect(auth, provider);
                // Note: This will redirect away from the page
                // The result will be handled in the useEffect with getRedirectResult
                return true;
            } else {
                // For desktop: use popup
                await signInWithPopup(auth, provider);
                return true;
            }
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            let message = "Google sign-in failed";

            if (err.code === "auth/popup-closed-by-user") {
                message = "Sign-in cancelled.";
            } else if (err.code === "auth/popup-blocked") {
                message = "Sign-in popup was blocked by your browser. Please allow popups for this site.";
            } else if (err.code === "auth/unauthorized-domain") {
                message = "This domain is not authorized for Google Sign-In. Please contact support.";
            } else if (err.message) {
                message = err.message;
            }

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
        signInWithGoogle,
        resetPassword,
        signOut,
        clearError,
    };
}
