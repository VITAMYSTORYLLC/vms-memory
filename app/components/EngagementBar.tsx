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
        <div className="flex items-center justify-between py-3 px-4 border-t border-[#E8E6E1] dark:border-gray-700">
            {/* Left: Like and Comment */}
            <div className="flex items-center gap-6">
                {/* Like Button */}
                <button
                    onClick={handleLike}
                    disabled={loading || !isAuthenticated}
                    className={`flex items-center gap-2 transition-all ${isAuthenticated ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed opacity-50'
                        }`}
                    title={!isAuthenticated ? 'Sign in to like' : ''}
                >
                    {hasLiked ? (
                        <FaHeart className="text-red-500 w-5 h-5 animate-pulse" />
                    ) : (
                        <FiHeart className="text-gray-600 dark:text-gray-400 w-5 h-5" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {likesCount}
                    </span>
                </button>

                {/* Comment Button */}
                <button
                    onClick={handleComment}
                    className="flex items-center gap-2 hover:scale-110 transition-all cursor-pointer"
                >
                    <FiMessageCircle className="text-gray-600 dark:text-gray-400 w-5 h-5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {commentsCount}
                    </span>
                </button>

                {/* View Count (Only shown to owner) */}
                {isOwner && viewsCount > 0 && (
                    <div className="flex items-center gap-2">
                        <FiEye className="text-gray-500 dark:text-gray-500 w-5 h-5" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {viewsCount}
                        </span>
                    </div>
                )}
            </div>

            {/* Right: Share Button */}
            {onShareClick && (
                <button
                    onClick={onShareClick}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <FiShare2 className="text-gray-600 dark:text-gray-400 w-4 h-4" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Share
                    </span>
                </button>
            )}
        </div>
    );
}
