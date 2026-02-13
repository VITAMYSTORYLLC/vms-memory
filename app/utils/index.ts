import { Lang, MemoryItem } from "../types";
import { LS } from "../constants";
import heic2any from "heic2any";
import imageCompression from "browser-image-compression";

export function normalize(s: string): string { return (s ?? "").trim(); }

export function makeId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export function canUseStorage() {
  try { return typeof window !== "undefined" && !!window.localStorage; } catch { return false; }
}

export function loadJSON<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try { const raw = window.localStorage.getItem(key); if (!raw) return null; return JSON.parse(raw) as T; } catch { return null; }
}

export function saveJSON(key: string, value: unknown) {
  if (!canUseStorage()) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

export function loadString(key: string): string {
  if (!canUseStorage()) return "";
  try { return window.localStorage.getItem(key) || ""; } catch { return ""; }
}

export function saveString(key: string, value: string) {
  if (!canUseStorage()) return;
  try { window.localStorage.setItem(key, value); } catch { }
}

export function removeKey(key: string) {
  if (!canUseStorage()) return;
  try { window.localStorage.removeItem(key); } catch { }
}

export function currentWeekNumber() { return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)); }

export function formatWhen(ts: number, lang: Lang) {
  try {
    const d = new Date(ts);
    const locale = lang === "es" ? "es-MX" : "en-US";
    return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  } catch { return ""; }
}

export function addMemory(existing: MemoryItem[], prompt: string, text: string, memoryDate?: string, imageUrl?: string, questionId?: string): MemoryItem[] {
  const p = normalize(prompt);
  const t = normalize(text);
  const md = normalize(memoryDate || "");
  const img = normalize(imageUrl || "");
  if (!t && !img) return existing;
  return [...existing, { id: makeId(), prompt: p, text: t, createdAt: Date.now(), memoryDate: md, imageUrl: img, questionId }];
}

export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  const m = index % length;
  return m < 0 ? m + length : m;
}

export function plural(n: number, one: string, many?: string) {
  if (n === 1) return one;
  if (many) return many;
  const lower = one.toLowerCase();
  if (lower.endsWith("story")) return "stories";
  if (lower.endsWith("historia")) return "historias";
  return `${one}s`;
}

export function loadUsedQuestionIndexes(personId: string): number[] {
  if (!personId) return [];
  const key = `${LS.usedPrefix}${personId}`;
  const loaded = loadJSON<number[]>(key);
  return Array.isArray(loaded) ? loaded.map((n) => Math.floor(Number(n))).filter((n) => Number.isFinite(n) && n >= 0) : [];
}

export function saveUsedQuestionIndexes(personId: string, used: number[]) {
  if (!personId) return;
  const key = `${LS.usedPrefix}${personId}`;
  const uniq = Array.from(new Set(used.map((n) => Math.floor(Number(n))))).filter((n) => Number.isFinite(n) && n >= 0);
  saveJSON(key, uniq);
}

export function nextUnusedIndex(from: number, delta: number, length: number, usedSet: Set<number>) {
  if (length <= 0) return 0;
  for (let step = 1; step <= length; step++) {
    const candidate = wrapIndex(from + delta * step, length);
    if (!usedSet.has(candidate)) return candidate;
  }
  return from;
}

export function loadBadges(personId: string): string[] {
  if (!personId) return [];
  const key = `${LS.badgesPrefix}${personId}`;
  const loaded = loadJSON<string[]>(key);
  return Array.isArray(loaded) ? loaded.map(String).filter(Boolean) : [];
}

export function hasBadge(personId: string, badgeId: string) { return loadBadges(personId).includes(badgeId); }

export function addBadge(personId: string, badgeId: string) {
  if (!personId || !badgeId) return;
  const current = loadBadges(personId);
  if (current.includes(badgeId)) return;
  saveJSON(`${LS.badgesPrefix}${personId}`, [...current, badgeId]);
}

export async function compressImage(file: File): Promise<string> {
  let imageFile = file;

  // Check for HEIC and convert if necessary
  if (file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
    try {
      // Use explicit blob creation for stability
      const buffer = await file.arrayBuffer();
      const blob = new Blob([buffer], { type: "image/heic" });

      const converted = await heic2any({
        blob,
        toType: "image/jpeg",
        quality: 0.9
      });

      const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
      // create a new File object
      imageFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg", lastModified: Date.now() });
    } catch (e: any) {
      console.error("HEIC conversion error:", e?.message || e);
      // We continue with original file in hopes browser supports it natively or compressor handles it
    }
  }

  // Use browser-image-compression for robust resizing/compression/EXIF handling
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    return await imageCompression.getDataUrlFromFile(compressedFile);
  } catch (error) {
    console.error("Image compression failed:", error);
    // Fallback: try to read original/converted file directly if compression failed
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  }
}

export function base64ToBlob(base64: string, mimeType: string = "image/jpeg"): Blob {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
