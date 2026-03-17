"use client";

import React, { useState } from 'react';
import { StoryComment } from '../types';
import { FiSend, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface StoryCommentsProps {
    comments: StoryComment[];
    currentUserId: string | null;
    currentUserName: string;
    currentUserPhoto?: string;
    isAuthenticated: boolean;
    onAddComment: (text: string) => Promise<void>;
    onUpdateComment: (commentId: string, newText: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
}

export default function StoryComments({
    comments,
    currentUserId,
    currentUserName,
    currentUserPhoto,
    isAuthenticated,
    onAddComment,
    onUpdateComment,
    onDeleteComment,
}: StoryCommentsProps) {
    const [commentText, setCommentText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!commentText.trim() || !isAuthenticated) return;

        setSubmitting(true);
        try {
            await onAddComment(commentText.trim());
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editText.trim()) return;

        setSubmitting(true);
        try {
            await onUpdateComment(commentId, editText.trim());
            setEditingId(null);
            setEditText('');
        } catch (error) {
            console.error('Error updating comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        setSubmitting(true);
        try {
            await onDeleteComment(commentId);
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (comment: StoryComment) => {
        setEditingId(comment.id);
        setEditText(comment.text);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const getRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    // Sort comments by newest first
    const sortedComments = [...comments].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="py-6 px-6 bg-white dark:bg-midnight-900 rounded-b-[2rem]">
            <h3 className="text-xs font-sans font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-6 flex items-center gap-2">
                {comments.length === 0 ? 'Be the first to comment' : `Comments (${comments.length})`}
            </h3>

            {/* Comment Input */}
            {isAuthenticated ? (
                <div className="mb-8">
                    <div className="flex gap-4">
                        {currentUserPhoto && (
                            <img
                                src={currentUserPhoto}
                                alt={currentUserName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-stone-100 dark:border-stone-800"
                            />
                        )}
                        {!currentUserPhoto && (
                            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 font-bold font-serif flex-shrink-0">
                                {currentUserName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 relative">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Add a comment..."
                                className="w-full px-4 py-3 bg-stone-50 dark:bg-midnight-950 border border-stone-100 dark:border-stone-800 rounded-2xl resize-none focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 text-stone-800 dark:text-stone-200 font-serif"
                                rows={2}
                                maxLength={500}
                                disabled={submitting}
                            />
                            <div className="flex justify-between items-center mt-2 px-1">
                                <span className="text-[10px] uppercase font-bold text-stone-300 dark:text-stone-700 font-sans tracking-widest">
                                    {commentText.length}/500
                                </span>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!commentText.trim() || submitting}
                                    className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-700 dark:hover:bg-white disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white dark:text-stone-900 rounded-full transition-colors flex items-center gap-2 disabled:cursor-not-allowed text-xs font-bold font-sans uppercase tracking-widest"
                                >
                                    <FiSend size={12} />
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-8 p-6 bg-stone-50 dark:bg-midnight-950 rounded-2xl text-center border border-dashed border-stone-200 dark:border-stone-800">
                    <p className="text-sm font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">
                        Sign in to leave a comment
                    </p>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
                {sortedComments.length === 0 && (
                    <p className="text-center text-stone-400 dark:text-stone-600 py-4 font-serif italic text-sm">
                        No comments yet.
                    </p>
                )}

                {sortedComments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                        {comment.userPhoto && (
                            <img
                                src={comment.userPhoto}
                                alt={comment.userName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-stone-100 dark:border-stone-800"
                            />
                        )}
                        {!comment.userPhoto && (
                            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 font-bold font-serif flex-shrink-0">
                                {comment.userName.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="bg-stone-50 dark:bg-midnight-950 border border-stone-100 dark:border-stone-800 rounded-2xl  rounded-tl-none px-5 py-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold font-sans text-xs tracking-wide text-stone-900 dark:text-stone-100">
                                        {comment.userName}
                                    </span>
                                    <span className="text-[10px] font-bold font-sans tracking-widest uppercase text-stone-400 dark:text-stone-600">
                                        {getRelativeTime(comment.createdAt)}
                                    </span>
                                </div>

                                {editingId === comment.id ? (
                                    <div className="mt-3">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-midnight-900 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-800 dark:text-stone-200 font-serif"
                                            rows={2}
                                            maxLength={500}
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleEdit(comment.id)}
                                                disabled={submitting || !editText.trim()}
                                                className="px-4 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold font-sans text-[10px] tracking-widest uppercase rounded-full disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={submitting}
                                                className="px-4 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 font-bold font-sans text-[10px] tracking-widest uppercase rounded-full"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-serif text-sm leading-relaxed">
                                        {comment.text}
                                    </p>
                                )}
                            </div>

                            {/* Edit/Delete buttons (only for own comments) */}
                            {currentUserId === comment.userId && editingId !== comment.id && (
                                <div className="flex gap-4 mt-2 ml-4">
                                    <button
                                        onClick={() => startEdit(comment)}
                                        className="text-[10px] font-bold font-sans uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5"
                                    >
                                        <FiEdit2 size={10} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-[10px] font-bold font-sans uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                                    >
                                        <FiTrash2 size={10} />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
