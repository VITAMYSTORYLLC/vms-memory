"use client";

import React from 'react';
import { FiHeart, FiMessageCircle, FiEye, FiShare2 } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

interface EngagementBarProps {
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    hasLiked: boolean;
    onLikeClick: () => void;
    onCommentClick: () => void;
    onShareClick?: () => void;
    isAuthenticated: boolean;
    isOwner?: boolean;
    loading?: boolean;
}

export default function EngagementBar({
    likesCount,
    commentsCount,
    viewsCount,
    hasLiked,
    onLikeClick,
    onCommentClick,
    onShareClick,
    isAuthenticated,
    isOwner = false,
    loading = false,
}: EngagementBarProps) {

    const handleLike = () => {
        if (!isAuthenticated) {
            return; // Could show a toast here
        }
        onLikeClick();
    };

    const handleComment = () => {
        onCommentClick();
    };

    return (
        <div className="flex items-center justify-between py-4 px-6">
            {/* Left: Like and Comment */}
            <div className="flex items-center gap-6">
                {/* Like Button */}
                <button
                    onClick={handleLike}
                    disabled={loading || !isAuthenticated}
                    className={`flex items-center gap-2.5 transition-all group ${isAuthenticated ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-50'
                        }`}
                    title={!isAuthenticated ? 'Sign in to like' : ''}
                >
                    <div className="relative">
                        {hasLiked ? (
                            <FaHeart className="text-red-500 w-5 h-5 drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)] animate-in zoom-in duration-300" />
                        ) : (
                            <FiHeart className="text-stone-400 dark:text-stone-500 w-5 h-5 group-hover:text-red-400 transition-colors" />
                        )}
                    </div>
                    <span className={`text-sm font-sans font-bold tracking-widest ${hasLiked ? 'text-red-500' : 'text-stone-500 dark:text-stone-400 group-hover:text-red-400'} transition-colors`}>
                        {likesCount}
                    </span>
                </button>

                {/* Comment Button */}
                <button
                    onClick={handleComment}
                    className="flex items-center gap-2.5 group hover:scale-105 transition-all cursor-pointer"
                >
                    <FiMessageCircle className="text-stone-400 dark:text-stone-500 w-5 h-5 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
                    <span className="text-sm font-sans font-bold tracking-widest text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                        {commentsCount}
                    </span>
                </button>

                {/* View Count (Only shown to owner) */}
                {isOwner && viewsCount > 0 && (
                    <div className="flex items-center gap-2.5 opacity-50" title="Views">
                        <FiEye className="text-stone-500 dark:text-stone-500 w-5 h-5" />
                        <span className="text-sm font-sans font-bold tracking-widest text-stone-500 dark:text-stone-500">
                            {viewsCount}
                        </span>
                    </div>
                )}
            </div>

            {/* Right: Share Button */}
            {onShareClick && (
                <button
                    onClick={onShareClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors group"
                >
                    <FiShare2 className="text-stone-500 dark:text-stone-400 w-4 h-4 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
                    <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                        Share
                    </span>
                </button>
            )}
        </div>
    );
}
