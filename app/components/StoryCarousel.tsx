import React, { useState, useEffect, useRef, useCallback } from "react";
import { MemoryItem, Lang } from "../types";
import { TEXT } from "../constants";
import { formatWhen } from "../utils";
import { renderWithBoldName, stripBoldMarkers } from "../utils/text";
import { useSwipe } from "../hooks/useSwipe";
import { toPng } from "html-to-image";
import { ShareCard } from "./ShareCard";
import { useMemory } from "../context/MemoryContext";
import { Haptics } from "../utils/haptics";

function getTextSizeClass(text: string) {
  const len = text.length;
  if (len < 60) return "text-4xl"; // Very short/impactful
  if (len < 120) return "text-3xl"; // Standard short
  if (len < 200) return "text-2xl"; // Medium
  if (len < 350) return "text-xl";  // Long
  return "text-lg";                 // Very long (scrolls less)
}

interface StoryCarouselProps {
  items: MemoryItem[];
  lang: Lang;
  onDelete?: (id: string) => void;
  onEdit?: (item: MemoryItem) => void;
  onTogglePrivacy?: (id: string) => void;
  initialIndex?: number;
  lockedProgress?: { current: number; total: number };
  onUnlockClick?: () => void;
}

export function StoryCarousel({ items, lang, onDelete, onEdit, onTogglePrivacy, initialIndex = 0, lockedProgress, onUnlockClick }: StoryCarouselProps) {
  const { userName, addNotification, activePerson } = useMemory();
  const [index, setIndex] = useState(initialIndex);
  const [skipTransition, setSkipTransition] = useState(false);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = TEXT[lang];

  // Stop audio when swiping to a different card
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  }, [index]);

  const toggleAudio = useCallback((item: MemoryItem) => {
    if (playingId === item.id) {
      // Stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setPlayingId(null);
    } else {
      // Stop any current audio first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      const audio = new Audio(item.audioUrl);
      audio.play();
      audioRef.current = audio;
      setPlayingId(item.id);
      audio.onended = () => {
        audioRef.current = null;
        setPlayingId(null);
      };
    }
  }, [playingId]);

  // Fetch an image URL as a base64 data URL so html-to-image can embed it without CORS issues.
  async function fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async function downloadAsImage(item: MemoryItem) {
    const el = document.getElementById("share-card-content");
    if (!el) return;

    setIsCapturing(true);

    try {
      // Pre-fetch the image so html-to-image can embed it without CORS issues
      if (item.imageUrl) {
        const dataUrl = await fetchImageAsDataUrl(item.imageUrl);
        setShareImageDataUrl(dataUrl);
      }
      await new Promise(r => setTimeout(r, 150)); // Let React re-render with the data URL

      const dataUrl = await toPng(el, {
        width: 1080,
        height: 1080,
        style: {
          transform: 'scale(1)',
          left: '0',
          top: '0'
        }
      });

      const link = document.createElement("a");
      link.download = `memory-${item.id}.png`;
      link.href = dataUrl;
      link.click();

      addNotification(
        t.downloadSuccessTitle,
        t.downloadSuccessBody,
        "success",
        { titleKey: "downloadSuccessTitle", bodyKey: "downloadSuccessBody" }
      );
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setIsCapturing(false);
      setShareImageDataUrl(null);
    }
  }

  async function shareStory(item: MemoryItem) {
    const el = document.getElementById("share-card-content");
    if (!el) return;

    setIsCapturing(true);

    try {
      // Pre-fetch the story image as a data URL to avoid CORS issues in html-to-image
      if (item.imageUrl) {
        const fetched = await fetchImageAsDataUrl(item.imageUrl);
        setShareImageDataUrl(fetched);
      }
      await new Promise(r => setTimeout(r, 150)); // Let React re-render with the data URL

      // 1. Generate image for visual sharing
      const dataUrl = await toPng(el, {
        width: 1080,
        height: 1080,
        style: { transform: 'scale(1)', left: '0', top: '0' }
      });

      const blob = await (await fetch(dataUrl)).blob();
      const imageFile = new File([blob], `story-${item.id}.png`, { type: "image/png" });

      // 2. Prepare elaborated message
      let displayPrompt = item.prompt;

      // Detect the language the story was written in, based on its content
      // This prevents bilingual share messages when the app UI lang differs from the story lang
      const storyTextSample = `${item.prompt} ${item.text}`;
      const spanishPattern = /[áéíóúüñ¿¡]/i;
      const spanishWords = /\b(la|el|de|en|que|por|una|con|para|es|era|fue|muy|también|más|cuando|quería|tenía|había)\b/i;
      const storyLang: "en" | "es" =
        spanishPattern.test(storyTextSample) || spanishWords.test(storyTextSample)
          ? "es"
          : "en";
      const tStory = TEXT[storyLang];

      const isGeneric = item.prompt === "New Story" || item.prompt === "Nueva Historia" || item.prompt === "New Photo" || item.prompt === "Nueva Foto";

      if (isGeneric) {
        displayPrompt = storyLang === "es" ? "Comparte una historia o foto, lo que desees." : "Share a story or photo, whatever you wish.";
      }

      const cleanPrompt = stripBoldMarkers(displayPrompt);
      // Use *asterisks* to bold on WhatsApp/Telegram
      const subjectName = activePerson?.name ? `*${activePerson.name}*` : (storyLang === "es" ? "un ser querido" : "a loved one");

      // Force production URL for sharing
      const appUrl = "https://vms-memory.vercel.app";

      const messageParts = [
        tStory.shareMainMsg(subjectName),
        cleanPrompt ? `${cleanPrompt}` : "",
        `"${item.text}"`,
        tStory.shareVisitMsg,
        `${tStory.shareCollectionMsg} ${appUrl}`,
      ].filter(p => p !== null && p !== undefined && p !== "");

      const fullText = messageParts.join("\n");

      // 3. Share with file if supported
      if (navigator.share) {
        const shareData: ShareData = {
          // title removed to avoid redundancy
          text: fullText,
        };

        // Try sharing both image and text if supported
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          shareData.files = [imageFile];
        }

        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(fullText);
        alert(t.shareSuccess);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Failed to share story:", err);
      }
    } finally {
      setIsCapturing(false);
      setShareImageDataUrl(null);
    }
  }

  function prev() {
    if (index > 0) {
      Haptics.light();
      setShowDeleteConfirm(false);
      setIndex(index - 1);
    }
  }

  function next() {
    let extraCards = 0;
    if (lockedProgress) extraCards = 1;
    const maxRealIndex = items.length + extraCards - 1;

    Haptics.light();
    setShowDeleteConfirm(false);

    if (index <= maxRealIndex) {
      // Slide right into the next card (or clone of first if at end)
      setIndex(index + 1);
      if (index === maxRealIndex) {
        // After animation completes, silently snap back to real index 0
        setTimeout(() => {
          setSkipTransition(true);
          setIndex(0);
          requestAnimationFrame(() => requestAnimationFrame(() => setSkipTransition(false)));
        }, 510);
      }
    }
  }

  const swipeHandlers = useSwipe(next, prev);

  useEffect(() => {
    if (items.length <= 0) return;
    setIndex((i) => Math.max(0, Math.min(i, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, items.length]);

  // If no items, rendering nothing (StoriesPage should handle empty state/Locked state)
  if (items.length === 0 && !lockedProgress) return null;

  // Build the list of extra cards
  const extraCards = [];
  if (lockedProgress) {
    extraCards.push({ id: "locked_card" });
  }

  const allItems = items.concat(extraCards as any);
  // Clone first card at the end so right-arrow wrap looks like a forward swipe
  const displayItems = allItems.length > 1 ? [...allItems, allItems[0]] : allItems;
  // Which dot to highlight (clone of first = dot 0)
  const activeDotIndex = index >= allItems.length ? 0 : index;

  return (
    <div className="relative w-full overflow-hidden py-2 h-[580px] group transition-colors duration-500">
      <div
        {...swipeHandlers}
        className="flex h-full select-none"
        style={{
          transform: `translateX(calc(-${index * 90}% + 5%))`,
          width: '100%',
          transition: skipTransition ? 'none' : 'transform 500ms ease-out',
        }}
      >
        {displayItems.map((item, i) => {
          const isLockedCard = item.id === "locked_card";
          const isActionCard = isLockedCard; // We removed other action cards

          const isActive = i === index;
          const textSizeClass = !isActionCard ? getTextSizeClass(item.text) : "";

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isActive) {
                  setShowDeleteConfirm(false);
                  setIndex(i);
                } else if (isLockedCard && onUnlockClick) {
                  onUnlockClick();
                }
              }}
              className={`flex-shrink-0 w-[90%] px-2 h-full transition-all duration-500 ease-out cursor-pointer ${isActive ? "scale-100 opacity-100 cursor-default" : "scale-[0.92] opacity-60 hover:opacity-80"}`}
              style={{ flex: "0 0 90%" }}
            >
              <div className="bg-white dark:bg-midnight-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-[2rem] h-full flex flex-col relative overflow-hidden transition-colors">
                {isActionCard ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 gap-0">

                    {/* Story progress dots */}
                    <div className="flex gap-3 mb-8">
                      {Array.from({ length: lockedProgress?.total || 5 }).map((_, i) => {
                        const filled = i < (lockedProgress?.current || 0);
                        return (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-700 ${filled
                              ? 'bg-stone-800 dark:bg-stone-100 scale-110'
                              : 'bg-stone-200 dark:bg-stone-800'
                              }`}
                          />
                        );
                      })}
                    </div>

                    {/* Hero CTA */}
                    <div className="space-y-3 w-full mb-8">
                      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400 dark:text-stone-600">
                        {lockedProgress?.current || 0} / {lockedProgress?.total || 5} {t.chaptersCompleted}
                      </p>
                      <h4 className="text-stone-900 dark:text-stone-100 font-serif font-bold text-3xl leading-snug">
                        {(lockedProgress?.current || 0) <= 1 ? t.lockedHeroTitle : t.lockedHeroTitleKeepGoing}
                      </h4>
                      <p className="text-stone-400 dark:text-stone-600 font-sans text-sm leading-relaxed max-w-[220px] mx-auto italic">
                        {t.lockedSubtitle}
                      </p>
                    </div>


                    {/* Big CTA button */}
                    <button
                      onClick={onUnlockClick}
                      className="w-full py-4 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold uppercase tracking-[0.18em] text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-stone-800 dark:hover:bg-white shadow-lg shadow-stone-200/60 dark:shadow-none"
                    >
                      <span>{t.continueJourney}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    {showDeleteConfirm && isActive && onDelete && (
                      <div className="absolute inset-0 z-50 bg-white/95 dark:bg-midnight-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 font-sans">
                        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t.confirmDeleteTitle}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 text-center">{t.confirmDeleteBody}</p>
                        <div className="flex gap-3 w-full">
                          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-stone-100 dark:bg-midnight-800 rounded-lg text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">{t.cancel}</button>
                          <button onClick={() => { onDelete(item.id); setShowDeleteConfirm(false); }} className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">{t.confirm}</button>
                        </div>
                      </div>
                    )}

                    <div className="bg-stone-50 dark:bg-midnight-950/50 w-full px-8 pt-8 pb-8 flex flex-col items-center text-center space-y-6 relative flex-shrink-0 border-b border-stone-100 dark:border-stone-800/50">

                      {/* Top bar: Private badge (left) + Action icons (right) — single row, same height */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        {/* Left: Private pill — empty placeholder keeps icons right-aligned when not private */}
                        <div className="flex items-center">
                          {item.isPrivate && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
                              {lang === 'es' ? 'Privado' : 'Private'}
                            </span>
                          )}
                        </div>

                        {/* Right: Action icons */}
                        <div className="flex items-center gap-3 text-stone-300 dark:text-stone-700">
                          <button
                            disabled={isCapturing}
                            onClick={(e) => { e.stopPropagation(); downloadAsImage(item); }}
                            className={`${isCapturing ? 'opacity-50' : 'hover:text-stone-600 dark:hover:text-stone-400'} transition-colors p-1`}
                            title="Download as Image"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.isPrivate) {
                                addNotification(t.privateShareTitle, t.privateShareBody, 'error');
                                return;
                              }
                              shareStory(item);
                            }}
                            className={`transition-colors p-1 ${item.isPrivate ? 'opacity-30 cursor-not-allowed' : 'hover:text-stone-600 dark:hover:text-stone-400'}`}
                            title={item.isPrivate
                              ? (lang === 'es' ? 'Historia privada — hazla pública para compartir' : 'Private story — make it public to share')
                              : t.shareStory
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                          </button>

                          {/* Privacy toggle: eye = visible, closed lock = private */}
                          {onTogglePrivacy && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onTogglePrivacy(item.id); }}
                              className={`transition-colors p-1 ${
                                item.isPrivate
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'hover:text-stone-600 dark:hover:text-stone-400'
                              }`}
                              title={item.isPrivate
                                ? (lang === 'es' ? 'Solo tú puedes ver esto — toca para hacer público' : 'Only you can see this — tap to make visible')
                                : (lang === 'es' ? 'Visible — toca para hacer privado' : 'Visible — tap to make private')
                              }
                            >
                              {item.isPrivate ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              )}
                            </button>
                          )}

                          {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="hover:text-stone-600 dark:hover:text-stone-400 transition-colors p-1" title="Edit memory">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                          )}
                          {onDelete && (
                            <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="hover:text-red-500 transition-colors p-1" title="Delete memory">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 pt-2">
                        {formatWhen(item.createdAt, lang)}
                      </div>

                      {/* Title/Prompt & New Status Group */}
                      <div className="w-full flex flex-col items-center gap-5">
                        {(() => {
                          // Detect photo-only cards with no custom title
                          const isPhotoOnly = !!item.imageUrl && !item.text;
                          const isGenericPhotoTitle = item.prompt === "New Photo" || item.prompt === "Nueva Foto" || item.prompt === "";
                          // Detect AI-question cards: they have a question-like prompt AND text content
                          const isAICard = !!item.text && item.prompt && item.prompt.endsWith("?");

                          if (isPhotoOnly && isGenericPhotoTitle) {
                            return (
                              <h3 className="font-serif italic text-2xl text-stone-300 dark:text-stone-700 leading-snug w-full px-4">
                                {lang === "es" ? "Un momento" : "A moment"}
                              </h3>
                            );
                          }

                          return (
                            <div className="w-full px-4 space-y-2">
                              {isAICard && (
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 dark:text-stone-700">
                                  {lang === "es" ? "En respuesta a" : "In response to"}
                                </p>
                              )}
                              <h3 className="font-serif italic text-2xl text-stone-800 dark:text-stone-200 leading-snug">
                                {renderWithBoldName(item.prompt)}
                              </h3>
                            </div>
                          );
                        })()}

                        {/* New Status (Underneath title) */}
                        {item.createdAt > Date.now() - 24 * 60 * 60 * 1000 && (
                          <div className="text-amber-500 dark:text-amber-400 text-xs font-bold uppercase tracking-[0.2em] animate-in fade-in duration-500">
                            {lang === 'es' ? 'NUEVO' : 'NEW'}
                          </div>
                        )}
                      </div>

                    </div>


                    {/* Scrollable Body Area */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 w-full story-scroll text-center flex flex-col items-center justify-center">
                      {item.imageUrl && (
                        <div className={`rounded-2xl overflow-hidden shadow-sm border border-stone-100 dark:border-stone-800 ${!item.text && !item.audioUrl ? 'w-full' : 'mb-8 w-full'}`}>
                          <img src={item.imageUrl} alt="Memory" className={`w-full object-cover ${!item.text && !item.audioUrl ? 'max-h-[380px]' : 'max-h-[220px]'}`} />
                        </div>
                      )}

                      {/* Large Play/Stop button for audio stories */}
                      {item.audioUrl ? (
                        <div className="flex flex-col items-center gap-6">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleAudio(item); }}
                            className="group flex items-center justify-center transition-transform duration-200 active:scale-95 hover:scale-105"
                            aria-label={playingId === item.id ? "Stop" : "Play"}
                          >
                            {playingId === item.id ? (
                              // Big stop icon
                              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                <rect x="28" y="28" width="64" height="64" rx="10" fill="currentColor" className="text-stone-800 dark:text-stone-100" />
                              </svg>
                            ) : (
                              // Big outlined play triangle
                              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                <polygon
                                  points="28,18 100,60 28,102"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="7"
                                  strokeLinejoin="round"
                                  className="text-stone-800 dark:text-stone-200"
                                />
                              </svg>
                            )}
                          </button>
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400 dark:text-stone-600">
                            {playingId === item.id ? (lang === "es" ? "Detener" : "Stop") : (lang === "es" ? "Escuchar" : "Play")}
                          </p>
                        </div>
                      ) : item.text ? (
                        <p className={`text-stone-800 dark:text-stone-300 leading-relaxed whitespace-pre-wrap ${item.imageUrl ? 'text-lg mt-2' : textSizeClass} font-serif transition-all duration-300`}>
                          {item.text}
                        </p>
                      ) : null}

                      {/* Generous padding at bottom for better scrolling feel */}
                      <div className="h-12 flex-shrink-0" />
                    </div>

                    {/* Gradient Fade for Scroll Hint */}
                    <div className="absolute bottom-14 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-midnight-900 to-transparent pointer-events-none" />

                    {/* Pagination Dots */}
                    <div className="h-14 w-full flex items-center justify-center bg-white dark:bg-midnight-900 border-t border-stone-100 dark:border-stone-800/50 absolute bottom-0">
                      <div className="flex gap-2">
                        {allItems.map((_, dotIndex) => (
                          <div
                            key={dotIndex}
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${dotIndex === activeDotIndex ? 'bg-stone-800 dark:bg-stone-200' : 'bg-stone-200 dark:bg-stone-800'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Logo (Bottom Right) */}
                    <div className="absolute bottom-3 right-4 pointer-events-none z-10">
                      {/* Light mode logo */}
                      <img
                        src="/logo-transparent.png"
                        alt="Logo"
                        className="w-16 h-auto mix-blend-multiply dark:hidden"
                      />
                      {/* Dark / Midnight mode logo */}
                      <img
                        src="/logo-dark.png"
                        alt="Logo"
                        className="w-16 h-auto hidden dark:block mix-blend-screen"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden Share Card Render */}
      <div className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none">
        {isActiveItem(index, allItems) && (
          <ShareCard item={allItems[index]} lang={lang} personName={activePerson?.name || ""} imageDataUrl={shareImageDataUrl || undefined} />
        )}
      </div>

      {/* Navigation Arrows */}
      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:scale-110 transition-transform duration-200 focus:outline-none"
          aria-label="Previous story"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:scale-110 transition-transform duration-200 focus:outline-none"
        aria-label="Next story"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
}

function isActiveItem(index: number, items: any[]): boolean {
  return items[index] && items[index].id !== "add_card" && items[index].id !== "add_photo" && items[index].id !== "add_audio" && items[index].id !== "locked_card" && items[index].id !== "ai_questions_card";
}
