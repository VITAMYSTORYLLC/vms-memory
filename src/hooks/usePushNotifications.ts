'use client';

import { useEffect, useRef } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, collection } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Requests push notification permission, gets the FCM token, and saves it
 * to Firestore under users/{uid}/fcmTokens/{token}.
 * Runs once per user session after sign-in.
 */
export function usePushNotifications(uid: string | null) {
  const tokenSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || !VAPID_KEY) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;

    (async () => {
      try {
        // 1. Check if the browser supports FCM
        const supported = await isSupported();
        if (!supported || cancelled) return;

        // 2. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;

        // 3. Get FCM token
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (!token || cancelled) return;

        // Avoid duplicate writes in the same session
        if (tokenSavedRef.current === token) return;
        tokenSavedRef.current = token;

        // 4. Save token to Firestore (deduped by token as document ID)
        const tokenRef = doc(collection(db, 'users', uid, 'fcmTokens'), token);
        await setDoc(tokenRef, {
          token,
          platform: 'web',
          createdAt: Date.now(),
          uid,
        }, { merge: true });

        console.log('[usePushNotifications] FCM token saved.');
      } catch (err) {
        console.error('[usePushNotifications] Error:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);
}
