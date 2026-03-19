'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useMemory } from '../context/MemoryContext';

interface PendingAnswer {
  id: string;
  questionId: string;
  prompt: string;
  personName: string;
  personId: string;
  responderName: string;
  text: string;
  createdAt: number;
}

interface Props {
  lang: 'en' | 'es';
}

export default function PendingAnswers({ lang }: Props) {
  const { user } = useAuth();
  const { saveStory, setActivePersonId, setIsCustomMode, people } = useMemory();
  const [answers, setAnswers] = useState<PendingAnswer[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    // Watch all questions owned by this user
    const q = query(
      collection(db, 'asked_questions'),
      where('ownerId', '==', uid)
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const pending: PendingAnswer[] = [];
      for (const qDoc of snap.docs) {
        const qData = qDoc.data();
        const answersSnap = await getDocs(
          collection(db, 'asked_questions', qDoc.id, 'answers')
        );
        for (const aDoc of answersSnap.docs) {
          const aData = aDoc.data();
          if (!aData.imported) {
            pending.push({
              id: aDoc.id,
              questionId: qDoc.id,
              prompt: qData.prompt,
              personName: qData.personName,
              personId: qData.personId,
              responderName: aData.responderName,
              text: aData.text,
              createdAt: aData.createdAt,
            });
          }
        }
      }
      pending.sort((a, b) => b.createdAt - a.createdAt);
      setAnswers(pending);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (answers.length === 0) return null;

  async function handleImport(answer: PendingAnswer) {
    // Switch to the right person and save as a memory
    const person = people.find(p => p.id === answer.personId);
    if (!person) return;

    setActivePersonId(answer.personId);
    setIsCustomMode(true);

    // We call saveStory with a pre-built prompt attributing to responder
    // Since saveStory reads from context drafts, we use a small workaround:
    // Navigate user to home with the draft pre-filled instead
    const memoryText = `${answer.responderName}: ${answer.text}`;
    const prompt = answer.prompt;

    // Mark as imported first
    await updateDoc(doc(db, 'asked_questions', answer.questionId, 'answers', answer.id), {
      imported: true,
    });

    // Store in sessionStorage for the home page to pick up
    sessionStorage.setItem('pendingImport', JSON.stringify({
      personId: answer.personId,
      prompt,
      text: memoryText,
    }));

    window.location.href = '/';
  }

  async function handleDismiss(answer: PendingAnswer) {
    await updateDoc(doc(db, 'asked_questions', answer.questionId, 'answers', answer.id), {
      imported: true, // mark as handled (dismissed = we don't want to see again)
    });
  }

  const visible = expanded ? answers : answers.slice(0, 2);

  return (
    <div className="mx-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600 font-sans">
            {lang === 'es' ? 'Respuestas Pendientes' : 'Pending Answers'}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-600 font-serif italic">
            {answers.length} {lang === 'es' ? 'memoria(s) esperando' : `memor${answers.length === 1 ? 'y' : 'ies'} waiting`}
          </p>
        </div>
        <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">
          {answers.length}
        </span>
      </div>

      <div className="space-y-3">
        {visible.map(answer => (
          <div
            key={`${answer.questionId}-${answer.id}`}
            className="bg-white dark:bg-midnight-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-4 shadow-sm"
          >
            {/* Question */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700 font-sans mb-1">
              {answer.personName}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-600 font-serif italic mb-3">
              "{answer.prompt}"
            </p>

            {/* Answer */}
            <div className="bg-stone-50 dark:bg-midnight-950 rounded-xl p-3 mb-3">
              <p className="text-xs font-bold text-stone-500 dark:text-stone-500 font-sans uppercase tracking-wider mb-1">
                {answer.responderName}
              </p>
              <p className="text-sm font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                {answer.text}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleImport(answer)}
                className="flex-1 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold font-sans uppercase tracking-wider rounded-xl active:scale-[0.98] transition-transform"
              >
                {lang === 'es' ? '+ Importar como recuerdo' : '+ Save as Memory'}
              </button>
              <button
                onClick={() => handleDismiss(answer)}
                className="px-3 py-2 text-stone-400 dark:text-stone-600 text-xs font-bold font-sans uppercase tracking-wider rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {lang === 'es' ? 'Ignorar' : 'Dismiss'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {answers.length > 2 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-3 py-2 text-stone-400 dark:text-stone-600 text-xs font-bold font-sans uppercase tracking-wider"
        >
          {expanded
            ? (lang === 'es' ? 'Ver menos' : 'Show less')
            : (lang === 'es' ? `Ver ${answers.length - 2} más` : `Show ${answers.length - 2} more`)}
        </button>
      )}
    </div>
  );
}
