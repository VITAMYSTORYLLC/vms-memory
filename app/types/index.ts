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
  questionId?: string;
};

export type Person = {
  id: string;
  name: string;
  memories: MemoryItem[];
  createdAt: number;
  photoUrl?: string;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
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
