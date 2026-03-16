"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlankQuestion, submitFamilyAnswer } from "../../utils/engagement";
import { useAuth } from "../../hooks/useAuth";
import { BlankQuestion, FamilyAnswer } from "../../types";
import { FiArrowLeft, FiSend, FiLock, FiCheck } from "react-icons/fi";

export default function BlankQuestionPage() {
    const params = useParams();
    const router = useRouter();
    const shareId = params?.shareId as string;
    const { user } = useAuth();

    const [question, setQuestion] = useState<BlankQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [alreadyAnswered, setAlreadyAnswered] = useState(false);

    const userId = user?.uid || null;
    const userName = user?.displayName || user?.email?.split("@")[0] || "Family Member";
    const userPhoto = user?.photoURL || undefined;
    const isOwner = question && userId === question.ownerId;

    useEffect(() => {
        if (!shareId) return;
        const load = async () => {
            try {
                setLoading(true);
                const q = await getBlankQuestion(shareId);
                if (!q) {
                    setError("This question link is no longer available.");
                } else {
                    setQuestion(q);
                    // Check if this user already answered
                    if (userId && q.answers.some((a) => a.authorId === userId)) {
                        setAlreadyAnswered(true);
                    }
                }
            } catch {
                setError("Failed to load question.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [shareId, userId]);

    const handleSubmit = async () => {
        if (!answer.trim() || !userId) return;
        setSubmitting(true);
        try {
            await submitFamilyAnswer(shareId, userId, userName, userPhoto, answer.trim());
            setSubmitted(true);
            setQuestion((prev) =>
                prev
                    ? {
                        ...prev,
                        answers: [
                            ...prev.answers,
                            {
                                id: "pending",
                                questionId: shareId,
                                authorId: userId,
                                authorName: userName,
                                authorPhoto: userPhoto,
                                text: answer.trim(),
                                createdAt: Date.now(),
                            } as FamilyAnswer,
                        ],
                    }
                    : prev
            );
        } catch {
            alert("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading State ──
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F8F6] dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading question...</p>
                </div>
            </div>
        );
    }

    // ── Error State ──
    if (error || !question) {
        return (
            <div className="min-h-screen bg-[#F9F8F6] dark:bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <h1 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-3">
                        Link not found
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                        {error || "This question may no longer be available."}
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-[#8B7355] text-white rounded-xl text-sm font-medium"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F8F6] dark:bg-gray-900 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Back */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8 text-sm"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Context */}
                <p className="text-xs font-semibold tracking-widest text-[#8B7355] uppercase mb-1">
                    Question about
                </p>
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-1">
                    {question.personName}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
                    Shared by {question.ownerName} · Help them preserve this memory
                </p>

                {/* Question Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
                    <p className="text-lg font-serif leading-snug text-gray-800 dark:text-gray-100">
                        {question.prompt}
                    </p>
                </div>

                {/* ── GUEST: prompt to sign in ── */}
                {!user && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-[#F5F0E8] dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                            <FiLock className="w-5 h-5 text-[#8B7355]" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Sign in to share your memory
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Create a free account to contribute your answer. It only takes a minute.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-3 bg-[#8B7355] hover:bg-[#6F5940] text-white rounded-xl font-medium transition-colors text-sm"
                        >
                            Sign in to answer
                        </button>
                    </div>
                )}

                {/* ── OWNER: Read-only view ── */}
                {user && isOwner && (
                    <div className="bg-[#FDFAF5] dark:bg-gray-800/60 rounded-2xl border border-[#E8E0D0] dark:border-gray-700 p-5 text-sm text-gray-600 dark:text-gray-400 mb-6">
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Your shared question</p>
                        <p>Family members who receive this link can contribute their own memory here.</p>
                    </div>
                )}

                {/* ── FAMILY MEMBER: Submit answer ── */}
                {user && !isOwner && (
                    <>
                        {submitted || alreadyAnswered ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-green-100 dark:border-green-800 p-6 text-center shadow-sm mb-6">
                                <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                                    <FiCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                    Memory saved!
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Thank you for contributing to {question.personName}'s story. {question.ownerName} will be notified.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Share your memory here..."
                                    className="w-full p-5 text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none text-base leading-relaxed min-h-[180px] placeholder-gray-300 dark:placeholder-gray-600"
                                    autoFocus
                                />
                                <div className="border-t border-gray-100 dark:border-gray-700 p-4 flex justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!answer.trim() || submitting}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${answer.trim() && !submitting
                                                ? "bg-[#8B7355] hover:bg-[#6F5940] text-white"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {submitting ? (
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <FiSend className="w-4 h-4" />
                                        )}
                                        {submitting ? "Saving..." : "Share memory"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── All Answers ── */}
                {question.answers.length > 0 && (
                    <div className="mt-2">
                        <h3 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
                            {question.answers.length}{" "}
                            {question.answers.length === 1 ? "Memory" : "Memories"} Shared
                        </h3>
                        <div className="space-y-4">
                            {question.answers.map((a) => (
                                <div
                                    key={a.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
                                >
                                    {/* Author row */}
                                    <div className="flex items-center gap-3 mb-3">
                                        {a.authorPhoto ? (
                                            <img
                                                src={a.authorPhoto}
                                                alt={a.authorName}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[#8B7355] flex items-center justify-center text-white text-xs font-semibold">
                                                {a.authorName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                {a.authorName}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(a.createdAt).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                                        {a.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer CTA */}
                {!user && (
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
                        Powered by{" "}
                        <button
                            onClick={() => router.push("/")}
                            className="text-[#8B7355] font-medium"
                        >
                            VitaMyStory
                        </button>{" "}
                        · Start your own family legacy
                    </p>
                )}
            </div>
        </div>
    );
}
