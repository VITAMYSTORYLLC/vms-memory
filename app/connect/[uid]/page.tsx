'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types';

type Phase = 'loading' | 'invite' | 'success' | 'error' | 'self';

export default function ConnectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const inviterUid = params?.uid as string;

  const [inviter, setInviter] = useState<UserProfile | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [connecting, setConnecting] = useState(false);

  // Load the inviter's profile
  useEffect(() => {
    if (!inviterUid) { setPhase('error'); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', inviterUid));
        if (!snap.exists()) { setPhase('error'); return; }
        setInviter(snap.data() as UserProfile);
        setPhase('invite');
      } catch {
        setPhase('error');
      }
    })();
  }, [inviterUid]);

  // If it's yourself, show a message
  useEffect(() => {
    if (user && inviterUid && user.uid === inviterUid) setPhase('self');
  }, [user, inviterUid]);

  async function handleConnect() {
    if (!user || !inviter) return;
    setConnecting(true);
    try {
      // Canonical friendship ID: smaller UID first
      const [a, b] = [user.uid, inviterUid].sort();
      const friendshipId = `${a}_${b}`;
      await setDoc(doc(db, 'friendships', friendshipId), {
        uids: [a, b],
        fromUid: inviterUid,
        toUid: user.uid,
        status: 'accepted',
        createdAt: Date.now(),
      }, { merge: true });
      setPhase('success');
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  }

  if (phase === 'loading') return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
    </div>
  );

  if (phase === 'error') return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Invite not found</h1>
        <p className="text-stone-500 font-serif italic">This link may be invalid or expired.</p>
      </div>
    </div>
  );

  if (phase === 'self') return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <p className="text-4xl mb-4">😄</p>
        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">That's you!</h1>
        <p className="text-stone-500 font-serif italic">Share this link with someone else to connect.</p>
        <button onClick={() => router.push('/profile')} className="mt-8 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors">
          Back to Profile
        </button>
      </div>
    </div>
  );

  if (phase === 'success') return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6 animate-bounce">🤝</div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">You're connected!</h1>
        <p className="text-stone-500 font-serif italic text-lg">
          You and <strong>{inviter?.displayName}</strong> can now ask each other to share memories.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-10 w-full py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs rounded-2xl active:scale-[0.98] transition-transform"
        >
          Open VitaMyStory
        </button>
        <div className="mt-8 text-stone-300 text-xs font-sans uppercase tracking-widest">VitaMyStory</div>
      </div>
    </div>
  );

  // Main invite view
  return (
    <div className="min-h-screen bg-[#F9F8F6] py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-sm text-center">

        {/* Inviter avatar */}
        <div className="mb-8">
          {inviter?.photoUrl ? (
            <img src={inviter.photoUrl} alt={inviter.displayName} className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto bg-stone-200 flex items-center justify-center text-stone-400 text-4xl shadow-lg border-4 border-white">
              {inviter?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-300 font-sans mb-2">invited by</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">{inviter?.displayName}</h1>
        <p className="text-stone-500 font-serif italic text-lg leading-relaxed">
          wants to connect so you can help each other preserve family memories.
        </p>

        <div className="mt-10 space-y-4">
          {user ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs rounded-2xl disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {connecting ? 'Connecting…' : `Add ${inviter?.displayName?.split(' ')[0]} as a contact`}
            </button>
          ) : (
            <>
              <p className="text-stone-400 text-sm font-serif italic">Sign in to your VitaMyStory account to connect.</p>
              <button
                onClick={() => router.push(`/profile?connect=${inviterUid}`)}
                className="w-full py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs rounded-2xl active:scale-[0.98] transition-transform"
              >
                Sign in to connect
              </button>
            </>
          )}
        </div>

        <p className="text-center text-stone-300 text-xs font-sans uppercase tracking-widest mt-12">
          VitaMyStory — Preserving family stories
        </p>
      </div>
    </div>
  );
}
