"use client";

import { useEffect } from "react";
import { enableNetwork, disableNetwork } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Intercepts the Firestore SDK internal assertion errors (ID: ca9, b815, etc.)
 * that fire from the watch-stream layer before they can reach React's error
 * boundary and crash the UI.
 *
 * Root cause: a known race condition in Firebase ≤12.7.0 where the
 * _TargetState state machine receives a server response while a target is
 * being torn down, leaving `ve = -1`. The SDK throws a hard assertion instead
 * of recovering.
 *
 * Fix: catch the error at the window level, prevent it from propagating, then
 * cycle the Firestore network connection so the watch stream re-establishes
 * cleanly.
 */
export function FirebaseErrorGuard() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            const msg = event.message ?? "";
            if (msg.includes("FIRESTORE") && msg.includes("INTERNAL ASSERTION FAILED")) {
                // Prevent the error from reaching React's error boundary / Next.js overlay
                event.preventDefault();
                event.stopImmediatePropagation();
                console.warn("[FirebaseErrorGuard] Firestore internal assertion caught — reconnecting…", msg);

                // Cycle the network connection so the watch stream re-establishes
                disableNetwork(db)
                    .then(() => enableNetwork(db))
                    .catch(() => {/* already handled */});
            }
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const msg = String(event.reason?.message ?? event.reason ?? "");
            if (msg.includes("FIRESTORE") && msg.includes("INTERNAL ASSERTION FAILED")) {
                event.preventDefault();
                console.warn("[FirebaseErrorGuard] Firestore internal assertion (promise) caught — reconnecting…");
                disableNetwork(db)
                    .then(() => enableNetwork(db))
                    .catch(() => {});
            }
        };

        window.addEventListener("error", handleError, true);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("error", handleError, true);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, []);

    return null;
}
