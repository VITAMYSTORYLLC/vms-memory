"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Comment, Lang } from "../types";
import { useAuth } from "../hooks/useAuth";
import { PrimaryButton } from "./PrimaryButton";

interface CommentSectionProps {
    personId: string;
    lang: Lang;
}

export function CommentSection({ personId, lang }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [guestName, setGuestName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!personId) return;

        const q = query(
            collection(db, "shared_comments"),
            where("personId", "==", personId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments: Comment[] = [];
            snapshot.forEach((doc) => {
                fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
            });
            setComments(fetchedComments);
        });

        return () => unsubscribe();
    }, [personId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user && !guestName.trim()) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "shared_comments"), {
                personId,
                text: newComment.trim(),
                authorName: user ? (user.displayName || user.email?.split('@')[0] || "Anonymous") : guestName.trim(),
                authorId: user ? user.uid : null,
                createdAt: Date.now(), // Use client timestamp for simple sorting, or serverTimestamp if needed strictly
            });
            setNewComment("");
            if (!user) setGuestName(""); // Keep guest name? Maybe clear it. Let's clear it for now.
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setLoading(false);
        }
    };

    const t = {
        title: lang === "es" ? "Comentarios" : "Comments",
        placeholder: lang === "es" ? "Escribe un recuerdo..." : "Leave a memory...",
        namePlaceholder: lang === "es" ? "Tu nombre" : "Your name",
        post: lang === "es" ? "Publicar" : "Post",
        posting: lang === "es" ? "Publicando..." : "Posting...",
        guestLabel: lang === "es" ? "Publicando como invitado" : "Posting as guest",
        noComments: lang === "es" ? "Sé el primero en compartir un recuerdo." : "Be the first to share a memory.",
    };

    return (
        <div className="mt-8 pt-8 border-t border-stone-100 font-sans">
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-6">{t.title}</h3>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mb-10 space-y-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t.placeholder}
                    className="w-full p-4 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none h-24 text-base"
                />

                {!user && (
                    <div>
                        <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder={t.namePlaceholder}
                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                        />
                        <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider ml-1">{t.guestLabel}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !newComment.trim() || (!user && !guestName.trim())}
                        className="px-6 py-2 bg-stone-900 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
                    >
                        {loading ? t.posting : t.post}
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <p className="text-center text-stone-400 italic text-sm py-4">{t.noComments}</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-stone-900 text-sm">{comment.authorName}</span>
                                <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
