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
};

export type Person = {
  id: string;
  name: string;
  memories: MemoryItem[];
  createdAt: number;
};

export type AuthUser = {
  uid: string;
  email: string | null;
};

export type NotificationType = "info" | "success" | "feature";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: number;
  read: boolean;
}
