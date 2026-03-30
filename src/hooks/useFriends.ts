"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Friend, UserProfile } from "@/types";

export function useFriends(uid: string | null | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) { setFriends([]); return; }
    setLoading(true);

    // Listen to friendships where I am either side and status = accepted
    const q = query(
      collection(db, "friendships"),
      where("uids", "array-contains", uid),
      where("status", "==", "accepted")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const results: Friend[] = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const friendUid = data.uids.find((u: string) => u !== uid);
        if (!friendUid) continue;
        try {
          const profileSnap = await getDoc(doc(db, "users", friendUid));
          if (profileSnap.exists()) {
            const profile = profileSnap.data() as UserProfile;
            results.push({
              ...profile,
              uid: friendUid,
              friendshipId: docSnap.id,
              status: "accepted",
            });
          }
        } catch {
          // Skip profiles that can't be loaded
        }
      }
      setFriends(results);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [uid]);

  return { friends, loading };
}
