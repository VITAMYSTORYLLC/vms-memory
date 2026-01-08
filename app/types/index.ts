export type Step = "WELCOME" | "WRITE" | "SAVED" | "BADGE" | "HOME" | "PEOPLE" | "INTRO";
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
};

export type Person = {
  id: string;
  name: string;
  memories: MemoryItem[];
  createdAt: number;
};
