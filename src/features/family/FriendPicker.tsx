'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { Friend } from '@/types';

interface Props {
  lang: 'en' | 'es';
  onSendToFriend: (friend: Friend) => Promise<void>;
  onShareLink: () => void;
  onClose: () => void;
}

export default function FriendPicker({ lang, onSendToFriend, onShareLink, onClose }: Props) {
  const { user } = useAuth();
  const { friends, loading } = useFriends(user?.uid);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  async function handleSend(friend: Friend) {
    setSending(friend.uid);
    try {
      await onSendToFriend(friend);
      setSent(prev => new Set([...prev, friend.uid]));
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-midnight-900 rounded-t-[2rem] p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mb-6" />

        <h3 className="text-center font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-1">
          {lang === 'es' ? 'Pedir a tu familia' : 'Ask your family'}
        </h3>
        <p className="text-center text-xs text-stone-400 dark:text-stone-600 font-sans mb-6">
          {lang === 'es' ? 'Envía la pregunta directo o comparte el enlace' : 'Send directly or share the link'}
        </p>

        {/* Friends list */}
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stone-400" />
          </div>
        ) : friends.length > 0 ? (
          <div className="space-y-2 mb-5 max-h-52 overflow-y-auto">
            {friends.map(friend => (
              <div key={friend.uid} className="flex items-center gap-3 bg-stone-50 dark:bg-midnight-950 rounded-2xl p-3">
                {/* Avatar */}
                {friend.photoUrl ? (
                  <img src={friend.photoUrl} alt={friend.displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 font-bold text-sm flex-shrink-0">
                    {friend.displayName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="flex-1 font-serif text-stone-900 dark:text-stone-100 text-sm truncate">{friend.displayName}</span>
                {sent.has(friend.uid) ? (
                  <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">✓ {lang === 'es' ? 'Enviado' : 'Sent'}</span>
                ) : (
                  <button
                    onClick={() => handleSend(friend)}
                    disabled={sending === friend.uid}
                    className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold uppercase tracking-wider rounded-xl active:scale-[0.97] transition-transform disabled:opacity-50"
                  >
                    {sending === friend.uid ? '…' : (lang === 'es' ? 'Enviar' : 'Send')}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 mb-4">
            <p className="text-xs text-stone-400 dark:text-stone-600 font-serif italic">
              {lang === 'es' ? 'Aún no tienes contactos.' : 'No contacts yet.'}
            </p>
          </div>
        )}

        {/* Share link fallback */}
        <button
          onClick={() => { onShareLink(); onClose(); }}
          className="w-full py-3 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 dark:hover:bg-midnight-800 transition-colors"
        >
          ↗ {lang === 'es' ? 'Compartir enlace' : 'Share link instead'}
        </button>

        <button onClick={onClose} className="w-full mt-3 py-2 text-stone-400 text-xs font-bold uppercase tracking-wider">
          {lang === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
