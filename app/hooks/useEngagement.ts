import { useState, useEffect, useCallback } from 'react';
import {
    StoryEngagement,
    StoryComment,
    StoryLike
} from '../types';
import {
    getStoryEngagement,
    likeStory,
    unlikeStory,
    addComment,
    updateComment,
    deleteComment,
    trackStoryView,
    getUserActivityFeed,
    markActivityAsRead,
    markAllActivitiesAsRead
} from '../utils/engagement';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../utils/engagement';

export function useEngagement(shareId: string | null, userId: string | null) {
    const [engagement, setEngagement] = useState<StoryEngagement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial engagement data
    useEffect(() => {
        if (!shareId) {
            setEngagement(null);
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const loadEngagement = async () => {
            try {
                setLoading(true);
                setError(null);

                // Set up real-time listener
                const engagementRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
                unsubscribe = onSnapshot(
                    engagementRef,
                    (snapshot) => {
                        if (snapshot.exists()) {
                            setEngagement(snapshot.data() as StoryEngagement);
                        } else {
                            setEngagement(null);
                        }
                        setLoading(false);
                    },
                    (err) => {
                        console.error('Error listening to engagement:', err);
                        setError(err.message);
                        setLoading(false);
                    }
                );
            } catch (err: any) {
                console.error('Error loading engagement:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        loadEngagement();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [shareId]);

    // Check if current user has liked
    const hasLiked = useCallback(() => {
        if (!engagement || !userId) return false;
        return engagement.likes.some(like => like.userId === userId);
    }, [engagement, userId]);

    // Like/unlike handlers
    const handleLike = useCallback(async (userName: string, userPhoto?: string) => {
        if (!shareId || !userId) {
            throw new Error('Must be logged in to like');
        }

        try {
            const liked = hasLiked();
            if (liked) {
                await unlikeStory(shareId, userId);
            } else {
                await likeStory(shareId, userId, userName, userPhoto);
            }
        } catch (err: any) {
            console.error('Error toggling like:', err);
            throw err;
        }
    }, [shareId, userId, hasLiked]);

    // Comment handlers
    const handleAddComment = useCallback(async (
        text: string,
        userName: string,
        userPhoto?: string
    ): Promise<StoryComment> => {
        if (!shareId || !userId) {
            throw new Error('Must be logged in to comment');
        }

        try {
            return await addComment(shareId, userId, userName, text, userPhoto);
        } catch (err: any) {
            console.error('Error adding comment:', err);
            throw err;
        }
    }, [shareId, userId]);

    const handleUpdateComment = useCallback(async (
        commentId: string,
        newText: string
    ): Promise<void> => {
        if (!shareId || !userId) {
            throw new Error('Must be logged in to edit comment');
        }

        try {
            await updateComment(shareId, commentId, userId, newText);
        } catch (err: any) {
            console.error('Error updating comment:', err);
            throw err;
        }
    }, [shareId, userId]);

    const handleDeleteComment = useCallback(async (commentId: string): Promise<void> => {
        if (!shareId || !userId) {
            throw new Error('Must be logged in to delete comment');
        }

        try {
            await deleteComment(shareId, commentId, userId);
        } catch (err: any) {
            console.error('Error deleting comment:', err);
            throw err;
        }
    }, [shareId, userId]);

    // Track view (silent)
    const handleTrackView = useCallback(async (userName: string) => {
        if (!shareId || !userId) return;

        try {
            await trackStoryView(shareId, userId, userName);
        } catch (err: any) {
            console.error('Error tracking view:', err);
            // Silently fail for views
        }
    }, [shareId, userId]);

    return {
        engagement,
        loading,
        error,
        hasLiked: hasLiked(),
        handleLike,
        handleAddComment,
        handleUpdateComment,
        handleDeleteComment,
        handleTrackView,
    };
}

// Hook for activity feed
export function useActivityFeed(userId: string | null) {
    const [activities, setActivities] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setActivities([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const loadActivities = async () => {
            try {
                setLoading(true);

                // Set up real-time listener
                const activitiesRef = collection(db, COLLECTIONS.ACTIVITY_FEED, userId, 'activities');
                unsubscribe = onSnapshot(
                    activitiesRef,
                    (snapshot) => {
                        const activityList = snapshot.docs.map(doc => doc.data());
                        setActivities(activityList);
                        setUnreadCount(activityList.filter((a: any) => !a.read).length);
                        setLoading(false);
                    },
                    (err) => {
                        console.error('Error listening to activities:', err);
                        setLoading(false);
                    }
                );
            } catch (err: any) {
                console.error('Error loading activities:', err);
                setLoading(false);
            }
        };

        loadActivities();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userId]);

    const handleMarkAsRead = useCallback(async (activityId: string) => {
        if (!userId) return;
        try {
            await markActivityAsRead(userId, activityId);
        } catch (err) {
            console.error('Error marking activity as read:', err);
        }
    }, [userId]);

    const handleMarkAllAsRead = useCallback(async () => {
        if (!userId) return;
        try {
            await markAllActivitiesAsRead(userId);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    }, [userId]);

    return {
        activities,
        unreadCount,
        loading,
        handleMarkAsRead,
        handleMarkAllAsRead,
    };
}
