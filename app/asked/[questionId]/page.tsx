'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface QuestionData {
  prompt: string;
  personName: string;
  ownerName: string;
  ownerId: string;
}

type Phase = 'loading' | 'answer' | 'done' | 'error';

export default function AskedPage() {
  const params = useParams();
  const questionId = params?.questionId as string;

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [name, setName] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!questionId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'asked_questions', questionId));
        if (!snap.exists()) { setPhase('error'); return; }
        setQuestion(snap.data() as QuestionData);
        setPhase('answer');
      } catch {
        setPhase('error');
      }
    })();
  }, [questionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !answer.trim() || !question) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'asked_questions', questionId, 'answers'), {
        responderName: name.trim(),
        text: answer.trim(),
        createdAt: Date.now(),
        imported: false,
      });

      // Notify the owner (fire-and-forget)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUid: question.ownerId,
          title: '💬 New family answer',
          body: `${name.trim()} answered your question about ${question.personName}`,
          url: `https://vms-memory.vercel.app/stories`,
        }),
      }).catch(() => {});

      setPhase('done');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Question not found</h1>
        <p className="text-stone-500 font-serif italic">This link may be invalid or expired.</p>
      </div>
    </div>
  );

  if (phase === 'done') return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6 animate-bounce">✨</div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">Memory sent!</h1>
        <p className="text-stone-500 font-serif italic text-lg">
          Your memory about <strong>{question?.personName}</strong> has been shared. Thank you for keeping their story alive.
        </p>
        <div className="mt-12 text-stone-300 text-xs font-sans uppercase tracking-widest">
          VitaMyStory
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6] py-12 px-6 flex flex-col items-center">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-300 font-sans mb-3">
            {question?.ownerName} is asking about
          </p>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-6">
            {question?.personName}
          </h1>

          {/* The question */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <p className="text-xl font-serif text-stone-800 leading-relaxed italic">
              "{question?.prompt}"
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans mb-2">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Uncle Roberto"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-800 font-serif focus:outline-none focus:ring-2 focus:ring-stone-800 text-base"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans mb-2">
              Your memory
            </label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Share what you remember…"
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-800 font-serif focus:outline-none focus:ring-2 focus:ring-stone-800 text-base resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !answer.trim()}
            className="w-full py-4 bg-stone-900 text-white font-bold font-sans uppercase tracking-widest text-xs rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            {submitting ? 'Sending…' : 'Send Memory ✨'}
          </button>
        </form>

        {/* Branding */}
        <p className="text-center text-stone-300 text-xs font-sans uppercase tracking-widest mt-12">
          VitaMyStory — Preserving family stories
        </p>
      </div>
    </div>
  );
}
