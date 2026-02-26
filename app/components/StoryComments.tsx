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
        <div className="py-4 px-4">
            <h3 className="text-lg font-serif font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Comments {comments.length > 0 && `(${comments.length})`}
            </h3>

            {/* Comment Input */}
            {isAuthenticated ? (
                <div className="mb-6">
                    <div className="flex gap-3">
                        {currentUserPhoto && (
                            <img
                                src={currentUserPhoto}
                                alt={currentUserName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                        )}
                        {!currentUserPhoto && (
                            <div className="w-10 h-10 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-medium flex-shrink-0">
                                {currentUserName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Write a comment..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#8B7355] dark:bg-gray-800 dark:text-gray-200"
                                rows={2}
                                maxLength={500}
                                disabled={submitting}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-500">
                                    {commentText.length}/500
                                </span>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!commentText.trim() || submitting}
                                    className="px-4 py-2 bg-[#8B7355] hover:bg-[#6F5940] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                                >
                                    <FiSend className="w-4 h-4" />
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Sign in to leave a comment
                    </p>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {sortedComments.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No comments yet. Be the first to comment!
                    </p>
                )}

                {sortedComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        {comment.userPhoto && (
                            <img
                                src={comment.userPhoto}
                                alt={comment.userName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                        )}
                        {!comment.userPhoto && (
                            <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                                {comment.userName.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        {comment.userName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {getRelativeTime(comment.createdAt)}
                                    </span>
                                </div>

                                {editingId === comment.id ? (
                                    <div className="mt-2">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#8B7355] dark:bg-gray-700 dark:text-gray-200"
                                            rows={2}
                                            maxLength={500}
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleEdit(comment.id)}
                                                disabled={submitting || !editText.trim()}
                                                className="px-3 py-1 bg-[#8B7355] hover:bg-[#6F5940] text-white text-sm rounded disabled:bg-gray-300"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={submitting}
                                                className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {comment.text}
                                    </p>
                                )}
                            </div>

                            {/* Edit/Delete buttons (only for own comments) */}
                            {currentUserId === comment.userId && editingId !== comment.id && (
                                <div className="flex gap-3 mt-2 ml-2">
                                    <button
                                        onClick={() => startEdit(comment)}
                                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-[#8B7355] dark:hover:text-[#A68968] flex items-center gap-1"
                                    >
                                        <FiEdit2 className="w-3 h-3" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
                                    >
                                        <FiTrash2 className="w-3 h-3" />
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
