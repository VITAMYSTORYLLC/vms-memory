export type Step = "WELCOME" | "WRITE" | "SAVED" | "BADGE" | "HOME" | "PEOPLE" | "INTRO" | "LOGIN" | "REGISTER";
export type Lang = "en" | "es";

export type LastSaved = {
  personName: string;
  prompt: string;
  text: string;
  createdAt: number;
  personId?: string;
};

export type MemoryItem = {
  id: string;
  prompt: string;
  text: string;
  createdAt: number;
  memoryDate?: string;
  imageUrl?: string;
  audioUrl?: string;
  isAudioStory?: boolean;
  questionId?: string;
  // Collaboration
  status?: 'published' | 'pending';
  authorName?: string;
  authorId?: string;
  // Social engagement
  isShared?: boolean;
  shareId?: string;
  engagement?: {
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
  };
};

export type Person = {
  id: string;
  name: string;
  memories: MemoryItem[];
  createdAt: number;
  photoUrl?: string;
  aiQuestions?: string[];
  aiQuestionsUnlockedAt?: number;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

export type NotificationType = "info" | "success" | "feature" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: number;
  read: boolean;
  translationData?: {
    titleKey?: string;
    bodyKey?: string;
    params?: any;
  };
}

export interface Comment {
  id: string;
  personId: string;
  text: string;
  authorName: string;
  authorId?: string;
  createdAt: number;
}

// Social Engagement Types
export interface StoryLike {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: number;
}

export interface StoryComment {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

export interface StoryView {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  viewedAt: number;
}

export interface StoryEngagement {
  storyId: string;
  personId: string;
  authorId: string;
  likes: StoryLike[];
  comments: StoryComment[];
  views: StoryView[];
  shareCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'view' | 'share' | 'answer';
  storyId: string;
  storyPrompt: string;
  personName: string;
  actorId: string;
  actorName: string;
  actorPhoto?: string;
  commentText?: string;
  // For 'answer' type
  blankQuestionId?: string;
  answerText?: string;
  createdAt: number;
  read: boolean;
}

export interface FamilyAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: number;
}

export interface BlankQuestion {
  id: string;
  personId: string;
  personName: string;
  ownerId: string;
  ownerName: string;
  prompt: string;
  questionIndex: number;
  createdAt: number;
  answers: FamilyAnswer[];
}
