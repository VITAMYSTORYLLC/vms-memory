"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSharedStory } from '../../utils/engagement';
import { useEngagement } from '../../hooks/useEngagement';
import { useAuth } from '../../hooks/useAuth';
import EngagementBar from '../../components/EngagementBar';
import StoryComments from '../../components/StoryComments';
import { FiArrowLeft } from 'react-icons/fi';

interface SharedStory {
    shareId: string;
    storyId: string;
    personId: string;
    personName: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    prompt: string;
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    isAudioStory?: boolean;
    createdAt: number;
    sharedAt: number;
}

export default function SharedStoryPage() {
    const params = useParams();
    const router = useRouter();
    const shareId = params?.shareId as string;
    const { user } = useAuth();

    const [story, setStory] = useState<SharedStory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(false);

    const userId = user?.uid || null;
    const userName = user?.displayName || user?.email?.split('@')[0] || 'Guest';
    const userPhoto = user?.photoURL || undefined;

    const {
        engagement,
        loading: engagementLoading,
        hasLiked,
        handleLike,
        handleAddComment,
        handleUpdateComment,
        handleDeleteComment,
        handleTrackView,
    } = useEngagement(shareId, userId);

    // Load shared story
    useEffect(() => {
        if (!shareId) return;

        const loadStory = async () => {
            try {
                setLoading(true);
                const sharedStory = await getSharedStory(shareId);

                if (!sharedStory) {
                    setError('Story not found');
                } else {
                    setStory(sharedStory);
                }
            } catch (err: any) {
                console.error('Error loading shared story:', err);
                setError('Failed to load story');
            } finally {
                setLoading(false);
            }
        };

        loadStory();
    }, [shareId]);

    // Track view once loaded
    useEffect(() => {
        if (story && userId && userName && engagement) {
            // Only track if not the author
            if (userId !== story.authorId) {
                handleTrackView(userName);
            }
        }
    }, [story, userId, userName, engagement]);

    const handleLikeClick = async () => {
        if (!user) {
            alert('Please sign in to like this story');
            return;
        }

        try {
            await handleLike(userName, userPhoto);
        } catch (err) {
            console.error('Error liking story:', err);
        }
    };

    const handleCommentSubmit = async (text: string) => {
        if (!user) {
            alert('Please sign in to comment');
            return;
        }

        try {
            await handleAddComment(text, userName, userPhoto);
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        }
    };

    if (loading || engagementLoading) {
        return (
            <div className="min-h-screen bg-[#F9F8F6] dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading story...</p>
                </div>
            </div>
        );
    }

    if (error || !story) {
        return (
            <div className="min-h-screen bg-[#F9F8F6] dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Story Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error || 'This story may have been removed or the link is invalid.'}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-[#8B7355] hover:bg-[#6F5940] text-white rounded-lg transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = userId === story.authorId;
    const likesCount = engagement?.likes.length || 0;
    const commentsCount = engagement?.comments.length || 0;
    const viewsCount = engagement?.views.length || 0;

    return (
        <div className="min-h-screen bg-[#F9F8F6] dark:bg-gray-900 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        Back
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        {story.authorPhoto && (
                            <img
                                src={story.authorPhoto}
                                alt={story.authorName}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        )}
                        {!story.authorPhoto && (
                            <div className="w-12 h-12 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-medium">
                                {story.authorName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {story.authorName} shared a memory about
                            </p>
                            <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-200">
                                {story.personName}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Story Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
                    {/* Image */}
                    {story.imageUrl && (
                        <div className="relative w-full aspect-[4/3]">
                            <img
                                src={story.imageUrl}
                                alt="Story"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        <h3 className="text-lg font-serif font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            {story.prompt}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {story.text}
                        </p>
                        <div className="mt-4 text-xs text-gray-500">
                            {new Date(story.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                    </div>

                    {/* Engagement Bar */}
                    <EngagementBar
                        likesCount={likesCount}
                        commentsCount={commentsCount}
                        viewsCount={viewsCount}
                        hasLiked={hasLiked}
                        onLikeClick={handleLikeClick}
                        onCommentClick={() => setShowComments(!showComments)}
                        isAuthenticated={!!user}
                        isOwner={isOwner}
                    />

                    {/* Comments Section */}
                    {(showComments || commentsCount > 0) && engagement && (
                        <StoryComments
                            comments={engagement.comments || []}
                            currentUserId={userId}
                            currentUserName={userName}
                            currentUserPhoto={userPhoto}
                            isAuthenticated={!!user}
                            onAddComment={handleCommentSubmit}
                            onUpdateComment={handleUpdateComment}
                            onDeleteComment={handleDeleteComment}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Powered by VitaMyStory - Preserve your family's legacy</p>
                    {!user && (
                        <button
                            onClick={() => router.push('/')}
                            className="mt-2 text-[#8B7355] hover:text-[#6F5940] font-medium"
                        >
                            Create your own memories →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
