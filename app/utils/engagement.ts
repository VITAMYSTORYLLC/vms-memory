import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    StoryEngagement,
    StoryLike,
    StoryComment,
    StoryView,
    ActivityItem,
    MemoryItem,
    Person,
    BlankQuestion,
    FamilyAnswer,
} from '../types';
import { makeId } from './index';

// Collection names
export const COLLECTIONS = {
    SHARED_STORIES: 'shared_stories',
    STORY_ENGAGEMENT: 'story_engagement',
    ACTIVITY_FEED: 'activity_feed',
    BLANK_QUESTIONS: 'blank_questions',
};

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

// ==================== SHARE STORY ====================
export async function shareStory(
    story: MemoryItem,
    person: Person,
    authorId: string,
    authorName: string,
    authorPhoto?: string
): Promise<string> {
    const shareId = makeId();

    const sharedStory: SharedStory = {
        shareId,
        storyId: story.id,
        personId: person.id,
        personName: person.name,
        authorId,
        authorName,
        authorPhoto,
        prompt: story.prompt,
        text: story.text,
        imageUrl: story.imageUrl,
        audioUrl: story.audioUrl,
        isAudioStory: story.isAudioStory,
        createdAt: story.createdAt,
        sharedAt: Date.now(),
    };

    // Create shared story document
    await setDoc(doc(db, COLLECTIONS.SHARED_STORIES, shareId), sharedStory);

    // Initialize engagement document
    const engagementData: StoryEngagement = {
        storyId: story.id,
        personId: person.id,
        authorId,
        likes: [],
        comments: [],
        views: [],
        shareCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await setDoc(doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId), engagementData);

    return shareId;
}

// ==================== GET SHARED STORY ====================
export async function getSharedStory(shareId: string): Promise<SharedStory | null> {
    const docRef = doc(db, COLLECTIONS.SHARED_STORIES, shareId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as SharedStory;
    }
    return null;
}

// ==================== SET STORY PRIVACY ====================
// Called when user toggles isPrivate on a memory that has already been shared.
// Updates the Firestore shared_stories document so the public link respects privacy.
export async function setSharedStoryPrivacy(shareId: string, isPrivate: boolean): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SHARED_STORIES, shareId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        await updateDoc(docRef, { isPrivate });
    }
}

// ==================== LIKE STORY ====================
export async function likeStory(
    shareId: string,
    userId: string,
    userName: string,
    userPhoto?: string
): Promise<void> {
    const engagementRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
    const engagementSnap = await getDoc(engagementRef);

    if (!engagementSnap.exists()) {
        throw new Error('Story engagement not found');
    }

    const like: StoryLike = {
        id: makeId(),
        storyId: engagementSnap.data().storyId,
        userId,
        userName,
        userPhoto,
        createdAt: Date.now(),
    };

    await updateDoc(engagementRef, {
        likes: arrayUnion(like),
        updatedAt: Date.now(),
    });

    // Create activity for story author
    const sharedStory = await getSharedStory(shareId);
    if (sharedStory && sharedStory.authorId !== userId) {
        await createActivity({
            type: 'like',
            storyId: sharedStory.storyId,
            shareId,
            storyPrompt: sharedStory.prompt,
            personName: sharedStory.personName,
            authorId: sharedStory.authorId,
            actorId: userId,
            actorName: userName,
            actorPhoto: userPhoto,
        });
    }
}

// ==================== UNLIKE STORY ====================
export async function unlikeStory(
    shareId: string,
    userId: string
): Promise<void> {
    const engagementRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
    const engagementSnap = await getDoc(engagementRef);

    if (!engagementSnap.exists()) {
        throw new Error('Story engagement not found');
    }

    const engagement = engagementSnap.data() as StoryEngagement;
    const likeToRemove = engagement.likes.find(like => like.userId === userId);

    if (likeToRemove) {
        await updateDoc(engagementRef, {
            likes: arrayRemove(likeToRemove),
            updatedAt: Date.now(),
        });
    }
}

// ==================== ADD COMMENT ====================
export async function addComment(
    shareId: string,
    userId: string,
    userName: string,
    text: string,
    userPhoto?: string
): Promise<StoryComment> {
    const engagementRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
    const engagementSnap = await getDoc(engagementRef);

    if (!engagementSnap.exists()) {
        throw new Error('Story engagement not found');
    }

    const comment: StoryComment = {
        id: makeId(),
        storyId: engagementSnap.data().storyId,
        userId,
        userName,
        userPhoto,
        text,
        createdAt: Date.now(),
    };

    await updateDoc(engagementRef, {
        comments: arrayUnion(comment),
        updatedAt: Date.now(),
    });

    // Create activity for story author
    const sharedStory = await getSharedStory(shareId);
    if (sharedStory && sharedStory.authorId !== userId) {
        await createActivity({
            type: 'comment',
            storyId: sharedStory.storyId,
            shareId,
            storyPrompt: sharedStory.prompt,
            personName: sharedStory.personName,
            authorId: sharedStory.authorId,
            actorId: userId,
            actorName: userName,
            actorPhoto: userPhoto,
            commentText: text,
        });
    }

    return comment;
}

// ==================== UPDATE COMMENT ====================
export async function updateComment(
    shareId: string,
    commentId: string,
    userId: string,
    newText: string
): Promise<void> {
    const engagementRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
    const engagementSnap = await getDoc(engagementRef);

    if (!engagementSnap.exists()) {
        throw new Error('Story engagement not found');
    }

    const engagement = engagementSnap.data() as StoryEngagement;
    const commentIndex = engagement.comments.findIndex(c => c.id === commentId && c.userId === userId);

    if (commentIndex === -1) {
        throw new Error('Comment not found or unauthorized');
    }

    const updatedComments = [...engagement.comments];
    updatedComments[commentIndex] = {
        ...updatedComments[commentIndex],
        text: newText,
        updatedAt: Date.now(),
    };

    await updateDoc(engagementRef, {
        comments: updatedComments,
        updatedAt: Date.now(),
    });
}

// ==================== DELETE COMMENT ====================
export async function deleteComment(
    shareId: string,
    commentId: string,
    userId: string
): Promise<void> {
    const engagementRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
    const engagementSnap = await getDoc(engagementRef);

    if (!engagementSnap.exists()) {
        throw new Error('Story engagement not found');
    }

    const engagement = engagementSnap.data() as StoryEngagement;
    const commentToRemove = engagement.comments.find(c => c.id === commentId && c.userId === userId);

    if (!commentToRemove) {
        throw new Error('Comment not found or unauthorized');
    }

    await updateDoc(engagementRef, {
        comments: arrayRemove(commentToRemove),
        updatedAt: Date.now(),
    });
}

// ==================== TRACK VIEW ====================
export async function trackStoryView(
    shareId: string,
    userId: string,
    userName: string
): Promise<void> {
    const engagementRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
    const engagementSnap = await getDoc(engagementRef);

    if (!engagementSnap.exists()) {
        return; // Silently fail for views
    }

    const engagement = engagementSnap.data() as StoryEngagement;

    // Check if user already viewed
    const alreadyViewed = engagement.views.some(view => view.userId === userId);
    if (alreadyViewed) {
        return; // Only track once per user
    }

    const view: StoryView = {
        id: makeId(),
        storyId: engagement.storyId,
        userId,
        userName,
        viewedAt: Date.now(),
    };

    await updateDoc(engagementRef, {
        views: arrayUnion(view),
        updatedAt: Date.now(),
    });

    // Create activity for story author (silent, no notification)
    const sharedStory = await getSharedStory(shareId);
    if (sharedStory && sharedStory.authorId !== userId) {
        await createActivity({
            type: 'view',
            storyId: sharedStory.storyId,
            shareId,
            storyPrompt: sharedStory.prompt,
            personName: sharedStory.personName,
            authorId: sharedStory.authorId,
            actorId: userId,
            actorName: userName,
        });
    }
}

// ==================== GET ENGAGEMENT ====================
export async function getStoryEngagement(shareId: string): Promise<StoryEngagement | null> {
    const docRef = doc(db, COLLECTIONS.STORY_ENGAGEMENT, shareId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as StoryEngagement;
    }
    return null;
}

// ==================== ACTIVITY FEED ====================
interface CreateActivityParams {
    type: 'like' | 'comment' | 'view' | 'share';
    storyId: string;
    shareId: string;
    storyPrompt: string;
    personName: string;
    authorId: string;
    actorId: string;
    actorName: string;
    actorPhoto?: string;
    commentText?: string;
}

async function createActivity(params: CreateActivityParams): Promise<void> {
    const activity: ActivityItem = {
        id: makeId(),
        type: params.type,
        storyId: params.storyId,
        storyPrompt: params.storyPrompt,
        personName: params.personName,
        actorId: params.actorId,
        actorName: params.actorName,
        actorPhoto: params.actorPhoto,
        commentText: params.commentText,
        createdAt: Date.now(),
        read: false,
    };

    const activityRef = doc(db, COLLECTIONS.ACTIVITY_FEED, params.authorId, 'activities', activity.id);
    await setDoc(activityRef, activity);
}

export async function getUserActivityFeed(userId: string): Promise<ActivityItem[]> {
    const activitiesRef = collection(db, COLLECTIONS.ACTIVITY_FEED, userId, 'activities');
    const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as ActivityItem);
}

export async function markActivityAsRead(userId: string, activityId: string): Promise<void> {
    const activityRef = doc(db, COLLECTIONS.ACTIVITY_FEED, userId, 'activities', activityId);
    await updateDoc(activityRef, { read: true });
}

export async function markAllActivitiesAsRead(userId: string): Promise<void> {
    const activitiesRef = collection(db, COLLECTIONS.ACTIVITY_FEED, userId, 'activities');
    const snapshot = await getDocs(activitiesRef);

    const updates = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updates);
}

export async function deleteActivity(userId: string, activityId: string): Promise<void> {
    const activityRef = doc(db, COLLECTIONS.ACTIVITY_FEED, userId, 'activities', activityId);
    await deleteDoc(activityRef);
}

// ==================== BLANK QUESTIONS ====================

export async function shareBlankQuestion(
    personId: string,
    personName: string,
    ownerId: string,
    ownerName: string,
    prompt: string,
    questionIndex: number
): Promise<string> {
    const id = makeId();
    const blankQuestion: BlankQuestion = {
        id,
        personId,
        personName,
        ownerId,
        ownerName,
        prompt,
        questionIndex,
        createdAt: Date.now(),
        answers: [],
    };
    await setDoc(doc(db, COLLECTIONS.BLANK_QUESTIONS, id), blankQuestion);
    return id;
}

export async function getBlankQuestion(shareId: string): Promise<BlankQuestion | null> {
    const docRef = doc(db, COLLECTIONS.BLANK_QUESTIONS, shareId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as BlankQuestion;
    }
    return null;
}

export async function getBlankQuestionsForPerson(
    ownerId: string,
    personId: string
): Promise<BlankQuestion[]> {
    const q = query(
        collection(db, COLLECTIONS.BLANK_QUESTIONS),
        where('ownerId', '==', ownerId),
        where('personId', '==', personId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as BlankQuestion);
}

export async function submitFamilyAnswer(
    shareId: string,
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    text: string
): Promise<void> {
    const questionRef = doc(db, COLLECTIONS.BLANK_QUESTIONS, shareId);
    const questionSnap = await getDoc(questionRef);
    if (!questionSnap.exists()) throw new Error('Blank question not found');

    const question = questionSnap.data() as BlankQuestion;

    const answer: FamilyAnswer = {
        id: makeId(),
        questionId: shareId,
        authorId: userId,
        authorName: userName,
        authorPhoto: userPhoto,
        text,
        createdAt: Date.now(),
    };

    await updateDoc(questionRef, {
        answers: arrayUnion(answer),
    });

    // Notify owner
    if (question.ownerId !== userId) {
        const activity: ActivityItem = {
            id: makeId(),
            type: 'answer',
            storyId: shareId,
            storyPrompt: question.prompt,
            personName: question.personName,
            actorId: userId,
            actorName: userName,
            actorPhoto: userPhoto,
            blankQuestionId: shareId,
            answerText: text,
            createdAt: Date.now(),
            read: false,
        };
        const activityRef = doc(
            db,
            COLLECTIONS.ACTIVITY_FEED,
            question.ownerId,
            'activities',
            activity.id
        );
        await setDoc(activityRef, activity);
    }
}

// ==================== REPORT STORY ====================
export async function reportSharedStory(
    shareId: string,
    reporterId?: string,
    reason?: string
): Promise<void> {
    const reportId = makeId();
    const reportRef = doc(db, 'reports', reportId);
    
    await setDoc(reportRef, {
        shareId,
        reporterId: reporterId || 'anonymous',
        reason: reason || 'Inappropriate content',
        reportedAt: Date.now(),
        status: 'pending'
    });
}

