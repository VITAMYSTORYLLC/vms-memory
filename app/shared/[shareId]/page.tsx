"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSharedStory } from '../../utils/engagement';
import { useEngagement } from '../../hooks/useEngagement';
import { useAuth } from '../../hooks/useAuth';
import { useMemory } from '../../context/MemoryContext';
import EngagementBar from '../../components/EngagementBar';
import StoryComments from '../../components/StoryComments';
import { FiArrowLeft } from 'react-icons/fi';
import { FaPlay } from 'react-icons/fa';

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
    const { t, lang, addNotification } = useMemory();

    const [story, setStory] = useState<SharedStory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(false);

    const userId = user?.uid || null;
    const userName = user?.displayName || user?.email?.split('@')[0] || (lang === 'es' ? 'Invitado' : 'Guest');
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
            addNotification(
                lang === 'es' ? 'Se requiere inicio de sesión' : 'Sign in required',
                lang === 'es' ? 'Inicia sesión para dar me gusta a esta historia.' : 'Please sign in to like this story.',
                'error'
            );
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
            addNotification(
                lang === 'es' ? 'Se requiere inicio de sesión' : 'Sign in required',
                lang === 'es' ? 'Inicia sesión para comentar.' : 'Please sign in to comment.',
                'error'
            );
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
            <div className="min-h-screen bg-[#F9F8F6] dark:bg-midnight-950 flex items-center justify-center transition-colors duration-500">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 dark:border-stone-200 mx-auto mb-4"></div>
                    <p className="text-stone-500 dark:text-stone-400 font-serif italic">
                        {lang === 'es' ? 'Cargando historia...' : 'Loading story...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !story) {
        return (
            <div className="min-h-screen bg-[#F9F8F6] dark:bg-midnight-950 flex items-center justify-center transition-colors duration-500">
                <div className="text-center p-8 max-w-sm">
                    <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-4">
                        {lang === 'es' ? 'Historia no encontrada' : 'Story Not Found'}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 mb-8 italic font-serif">
                        {lang === 'es'
                            ? 'Es posible que esta historia haya sido eliminada o que el enlace no sea válido.'
                            : 'This story may have been removed or the link is invalid.'}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full px-6 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold uppercase tracking-widest text-xs transition-transform active:scale-[0.98]"
                    >
                        {lang === 'es' ? 'Volver al Inicio' : 'Go Home'}
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
        <div className="min-h-screen bg-[#F9F8F6] dark:bg-midnight-950 py-8 safe-top safe-bottom transition-colors duration-500">
            <div className="max-w-lg mx-auto px-4 w-full">
                
                {/* Header */}
                <div className="mb-8 mt-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors mb-6 font-sans uppercase tracking-widest text-xs font-bold"
                    >
                        <FiArrowLeft size={14} />
                        {lang === 'es' ? 'Volver' : 'Back'}
                    </button>

                    <div className="text-center mb-6">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-700 font-sans mb-2">
                            {lang === 'es' ? 'RECUERDO COMPARTIDO DE' : 'SHARED MEMORY OF'}
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
                            {story.personName}
                        </h1>

                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-stone-500 dark:text-stone-400">
                            {story.authorPhoto ? (
                                <img src={story.authorPhoto} alt={story.authorName} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-600 dark:text-stone-400">
                                    {story.authorName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="italic font-serif">
                                {lang === 'es' ? 'Escrito por' : 'Written by'} <strong>{story.authorName}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Story Card */}
                <div className="bg-white dark:bg-midnight-900 rounded-[2rem] shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden mb-8">
                    
                    {/* Media */}
                    {story.imageUrl && (
                        <div className="relative w-full aspect-square sm:aspect-[4/3] bg-stone-100 dark:bg-stone-800">
                            <img
                                src={story.imageUrl}
                                alt="Memory"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    
                    {story.audioUrl && (
                        <div className="p-6 bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700 flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center shadow-md">
                                <FaPlay size={20} className="ml-1" />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-8">
                        {story.prompt && (
                            <h3 className="text-sm font-sans uppercase tracking-widest font-bold text-stone-400 dark:text-stone-500 mb-4">
                                {story.prompt}
                            </h3>
                        )}
                        <p className="text-xl font-serif leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                            {story.text}
                        </p>
                        <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400 dark:text-stone-600 font-sans tracking-widest uppercase font-bold text-center">
                            {new Date(story.createdAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                    </div>

                    {/* Engagement Bar (Likes & Comments triggers) */}
                    <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-midnight-900/50 rounded-b-[2rem]">
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
                    </div>
                </div>

                {/* Comments Section (Slides open) */}
                {(showComments || commentsCount > 0) && engagement && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-300 relative z-0">
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
                    </div>
                )}

                {/* Footer branding */}
                <div className="text-center mt-12 mb-8">
                    {!user && (
                        <button
                            onClick={() => router.push('/')}
                            className="text-stone-900 dark:text-stone-100 font-bold font-sans uppercase tracking-widest text-xs hover:opacity-70 transition-opacity p-4"
                        >
                            {lang === 'es' ? 'Crea las tuyas →' : 'Create your own →'}
                        </button>
                    )}
                    <h1 className="font-serif font-bold text-2xl tracking-tight text-stone-900 dark:text-white flex items-center justify-center opacity-30 mt-4 pointer-events-none select-none">
                        Vita<span className="text-sm font-sans mt-3 -ml-0.5 tracking-normal">MyStory</span>
                    </h1>
                </div>
            </div>
        </div>
    );
}
