import React, { useState, useEffect } from "react";
import { MemoryItem, Lang } from "../types";
import { TEXT } from "../constants";
import { formatWhen } from "../utils";
import { renderWithBoldName, stripBoldMarkers } from "../utils/text";
import { useSwipe } from "../hooks/useSwipe";
import { toPng } from "html-to-image";
import { ShareCard } from "./ShareCard";
import { useMemory } from "../context/MemoryContext";
import { Haptics } from "../utils/haptics";
import { getQuestionText } from "../utils/questions";
import { FiCamera, FiMic, FiPlus, FiLock } from "react-icons/fi";

interface StoryCarouselProps {
  items: MemoryItem[];
  lang: Lang;
  onDelete?: (id: string) => void;
  onEdit?: (item: MemoryItem) => void;
  onAdd?: () => void;
  onAddPhoto?: () => void;
  onAddAudio?: () => void;
  initialIndex?: number;
  lockedProgress?: { current: number; total: number };
  onUnlockClick?: () => void;
}

export function StoryCarousel({ items, lang, onDelete, onEdit, onAdd, onAddPhoto, onAddAudio, initialIndex = 0, lockedProgress, onUnlockClick }: StoryCarouselProps) {
  const { userName, addNotification, activePerson } = useMemory();
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const t = TEXT[lang];

  async function downloadAsImage(item: MemoryItem) {
    const el = document.getElementById("share-card-content");
    if (!el) return;

    setIsCapturing(true);
    await new Promise(r => setTimeout(r, 100));

    try {
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
    }
  }

  async function shareStory(item: MemoryItem) {
    const el = document.getElementById("share-card-content");
    if (!el) return;

    setIsCapturing(true);
    await new Promise(r => setTimeout(r, 100));

    try {
      // 1. Generate image for visual sharing
      const dataUrl = await toPng(el, {
        width: 1080,
        height: 1080,
        style: { transform: 'scale(1)', left: '0', top: '0' }
      });

      const blob = await (await fetch(dataUrl)).blob();
      const imageFile = new File([blob], `story-${item.id}.png`, { type: "image/png" });

      // 2. Prepare elaborated message
      const cleanPrompt = stripBoldMarkers(item.prompt);
      const subjectName = activePerson?.name || (lang === "es" ? "un ser querido" : "a loved one");
      const appUrl = typeof window !== "undefined" ? window.location.origin : "https://vitamystory.com";

      const messageParts = [
        t.shareMainMsg(subjectName),
        "",
        cleanPrompt ? `${cleanPrompt}` : "",
        `"${item.text}"`,
        "",
        t.shareVisitMsg,
        `${t.shareCollectionMsg} ${appUrl}`,
      ].filter(p => p !== null && p !== undefined);

      const fullText = messageParts.join("\n");

      // 3. Share with file if supported
      if (navigator.share) {
        const shareData: ShareData = {
          title: "VitaMyStory",
          text: fullText,
          // url: appUrl, // URL might be redundant if in text, but good to have
        };

        // Try sharing both image and text if supported
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          shareData.files = [imageFile];
        }

        await navigator.share(shareData);

        // Simulate social feedback
        // Simulate social feedback
        setTimeout(() => {
          const type = Math.random() > 0.5 ? "saw" : "liked";
          const titleKey = type === "saw" ? "notificationSaw" : "notificationLike";
          const bodyKey = type === "saw" ? "notificationSawBody" : "notificationLikeBody";
          const title = t[titleKey] as string;
          const body = t[bodyKey] as string;

          addNotification(
            title,
            body,
            "success",
            { titleKey, bodyKey }
          );
        }, 1000 * (3 + Math.random() * 5));
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
    const extraCards = (onAdd ? 1 : 0) + (onAddPhoto ? 1 : 0) + (onAddAudio ? 1 : 0);
    const maxIndex = items.length + extraCards - 1;

    if (index < maxIndex) {
      Haptics.light();
      setShowDeleteConfirm(false);
      setIndex(index + 1);
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
  }, [index, items.length]); // Dependencies to ensure current state is captured

  if (items.length === 0 && !onAdd) return null; // If no items and no add functionality, return null

  // Build the list of extra cards
  const extraCards = [];
  if (lockedProgress) {
    extraCards.push({ id: "locked_card" });
  } else {
    if (onAdd) extraCards.push({ id: "add_card" });
    if (onAddPhoto) extraCards.push({ id: "add_photo" });
    if (onAddAudio) extraCards.push({ id: "add_audio" });
  }

  const allItems = items.concat(extraCards as any);

  return (
    <div className="relative w-full overflow-hidden py-2 h-[580px] group transition-colors duration-500">
      <div
        {...swipeHandlers}
        className="flex transition-transform duration-500 ease-out h-full select-none"
        style={{
          transform: `translateX(calc(-${index * 90}% + 5%))`,
          width: '100%'
        }}
      >
        {allItems.map((item, i) => {
          const isAddCard = item.id === "add_card";
          const isPhotoCard = item.id === "add_photo";
          const isAudioCard = item.id === "add_audio";
          const isLockedCard = item.id === "locked_card";
          const isActionCard = isAddCard || isPhotoCard || isAudioCard || isLockedCard;

          const isActive = i === index;
          const isLong = !isActionCard && item.text.length > 200;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isActive) {
                  setShowDeleteConfirm(false);
                  setIndex(i);
                } else if (isAddCard && onAdd) {
                  onAdd();
                } else if (isAudioCard && onAddAudio) {
                  onAddAudio();
                } else if (isLockedCard && onUnlockClick) {
                  onUnlockClick();
                }
              }}
              className={`flex-shrink-0 w-[90%] px-2 h-full transition-all duration-500 ease-out cursor-pointer ${isActive ? "scale-100 opacity-100 cursor-default" : "scale-[0.92] opacity-60 hover:opacity-80"}`}
              style={{ flex: "0 0 90%" }}
            >
              <div className="bg-white dark:bg-midnight-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-[2rem] h-full flex flex-col relative overflow-hidden transition-colors">
                {isActionCard ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in fade-in duration-500">
                    <div className={`w-20 h-20 rounded-full bg-stone-50 dark:bg-midnight-950 border-2 border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-600 group-hover:scale-110 transition-transform duration-500 ${isPhotoCard ? 'group-hover:text-blue-400 group-hover:border-blue-200' : isAudioCard ? 'group-hover:text-red-400 group-hover:border-red-200' : isLockedCard ? 'group-hover:text-amber-400 group-hover:border-amber-200' : ''}`}>
                      {isAddCard && <FiPlus size={32} />}
                      {isPhotoCard && <FiCamera size={32} />}
                      {isAudioCard && <FiMic size={32} />}
                      {isLockedCard && <FiLock size={32} />}
                    </div>
                    <div className="space-y-1 w-full">
                      <h4 className="text-stone-900 dark:text-stone-100 font-serif font-bold text-xl">
                        {isAddCard && t.newStoryTitle}
                        {isPhotoCard && t.newPhotoTitle}
                        {isAudioCard && t.newAudioTitle}
                        {isLockedCard && t.lockedTitle}
                      </h4>
                      <div className="text-stone-400 dark:text-stone-600 font-sans text-sm italic">
                        {isAddCard && t.newStorySubtitle}
                        {isPhotoCard && t.newPhotoSubtitle}
                        {isAudioCard && t.newAudioSubtitle}
                        {isLockedCard && (
                          <div className="space-y-3 mt-2">
                            <p>{t.lockedSubtitle}</p>
                            <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-stone-800 dark:bg-stone-100 h-full transition-all duration-1000 ease-out"
                                style={{ width: `${(lockedProgress?.current || 0) / (lockedProgress?.total || 1) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest">{lockedProgress?.current || 0} / {lockedProgress?.total || 5} {t.chaptersCompleted}</p>
                            <div className="pt-2">
                              <span className="text-xs font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 pb-0.5">{t.continueJourney}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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

                    <div className="bg-stone-50 dark:bg-midnight-950/50 w-full px-6 py-6 flex flex-col items-center space-y-4 border-b border-stone-100 dark:border-stone-800 relative flex-shrink-0">
                      <div className="absolute top-4 right-4 flex gap-3 text-stone-300 dark:text-stone-700">
                        <button
                          disabled={isCapturing}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadAsImage(item);
                          }}
                          className={`${isCapturing ? 'opacity-50' : 'hover:text-stone-600 dark:hover:text-stone-400'} transition-colors p-1`}
                          title="Download as Image"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareStory(item);
                          }}
                          className="hover:text-stone-600 dark:hover:text-stone-400 transition-colors p-1"
                          title={t.shareStory}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        </button>
                        {onEdit && (
                          <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="hover:text-stone-600 dark:hover:text-stone-400 transition-colors p-1" title="Edit memory">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="hover:text-red-400 dark:hover:text-red-500 transition-colors p-1" title="Delete memory">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        )}
                      </div>
                      <div className="text-xs font-bold text-stone-400 dark:text-stone-600 tracking-[0.2em] uppercase font-sans">
                        {formatWhen(item.createdAt, lang)}
                      </div>
                      {item.prompt ? (
                        <div className="text-lg text-stone-600 dark:text-stone-400 italic font-medium text-center px-4 leading-relaxed max-w-sm font-serif">
                          {renderWithBoldName(item.questionId ? getQuestionText(item.questionId, activePerson?.name || "", t) : item.prompt)}
                        </div>
                      ) : null}
                    </div>

                    <div className={`flex-1 bg-white dark:bg-midnight-900 p-6 flex flex-col w-full overflow-hidden transition-colors ${isLong || item.imageUrl ? 'justify-start items-start' : 'justify-center items-center'}`}>
                      {item.imageUrl && (
                        <div className="w-full h-48 mb-4 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 border border-stone-100 dark:border-stone-800">
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                        </div>
                      )}
                      <div
                        className={`leading-relaxed font-serif px-2 w-full break-words overflow-y-auto no-scrollbar transition-colors ${item.imageUrl
                          ? (isLong ? 'text-base text-stone-700 dark:text-stone-300' : 'text-xl text-stone-800 dark:text-stone-200')
                          : (isLong ? 'text-xl text-stone-700 dark:text-stone-300' : 'text-3xl sm:text-4xl text-stone-800 dark:text-stone-100 text-center')
                          }`}
                        style={{ maxHeight: '100%' }}
                      >
                        {item.text}
                      </div>
                    </div>
                  </>
                )}

                {isActive && (allItems.length) > 1 && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                    {allItems.map((_, dotIdx) => (
                      <div key={dotIdx} className={`h-1 w-1 rounded-full transition-all duration-300 ${dotIdx === i ? "bg-stone-800 dark:bg-stone-100 w-4" : "bg-stone-200 dark:bg-midnight-800"}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons for Desktop */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 dark:bg-midnight-800/90 backdrop-blur-sm rounded-full shadow-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-all hover:scale-110 hidden sm:flex items-center justify-center border border-stone-200 dark:border-stone-700 opacity-0 group-hover:opacity-100"
          aria-label="Previous story"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      )}
      {index < allItems.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 dark:bg-midnight-800/90 backdrop-blur-sm rounded-full shadow-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-all hover:scale-110 hidden sm:flex items-center justify-center border border-stone-200 dark:border-stone-700 opacity-0 group-hover:opacity-100"
          aria-label="Next story"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      )}

      {/* Hidden container for image generation */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none">
        {items[index] && (
          <ShareCard item={items[index]} lang={lang} userName={userName} />
        )}
      </div>
    </div>
  );
}
