import React, { useState, useEffect } from "react";
import { MemoryItem, Lang } from "../types";
import { TEXT } from "../constants";
import { formatWhen } from "../utils";
import { renderWithBoldName } from "../utils/text";
import { useSwipe } from "../hooks/useSwipe";

interface StoryCarouselProps {
  items: MemoryItem[];
  lang: Lang;
  onDelete?: (id: string) => void;
  onEdit?: (item: MemoryItem) => void;
}

export function StoryCarousel({ items, lang, onDelete, onEdit }: StoryCarouselProps) {
  const [index, setIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const t = TEXT[lang];

  function prev() {
    if (index > 0) {
      setShowDeleteConfirm(false);
      setIndex(index - 1);
    }
  }

  function next() {
    if (index < items.length - 1) {
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

  if (items.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-2 h-[580px] group">
      <div
        {...swipeHandlers}
        className="flex transition-transform duration-500 ease-out h-full select-none"
        style={{
          transform: `translateX(calc(-${index * 90}% + 5%))`,
          width: '100%'
        }}
      >
        {items.map((item, i) => {
          const isActive = i === index;
          const isLong = item.text.length > 70;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isActive) {
                  setShowDeleteConfirm(false);
                  setIndex(i);
                }
              }}
              className={`flex-shrink-0 w-[90%] px-2 h-full transition-all duration-500 ease-out cursor-pointer ${isActive ? "scale-100 opacity-100 cursor-default" : "scale-[0.92] opacity-60 hover:opacity-80"}`}
              style={{ flex: "0 0 90%" }}
            >
              <div className="bg-white border border-stone-200 shadow-xl rounded-[2rem] h-full flex flex-col relative overflow-hidden">
                {showDeleteConfirm && isActive && onDelete && (
                  <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 font-sans">
                    <h3 className="text-xl font-bold text-stone-900 mb-2">{t.confirmDeleteTitle}</h3>
                    <p className="text-sm text-stone-500 mb-6 text-center">{t.confirmDeleteBody}</p>
                    <div className="flex gap-3 w-full">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-stone-100 rounded-lg text-stone-600 font-medium hover:bg-stone-200 transition-colors">{t.cancel}</button>
                      <button onClick={() => { onDelete(item.id); setShowDeleteConfirm(false); }} className="flex-1 py-3 bg-red-50 rounded-lg text-red-600 font-medium hover:bg-red-100 transition-colors">{t.confirm}</button>
                    </div>
                  </div>
                )}

                <div className="bg-stone-50 w-full px-6 py-6 flex flex-col items-center space-y-4 border-b border-stone-100 relative flex-shrink-0">
                  <div className="absolute top-4 right-4 flex gap-3 text-stone-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const textToShare = `${renderWithBoldName(item.prompt)}\n\n"${item.text}"\n\n— via VitaMyStory`;
                        if (navigator.share) {
                          navigator.share({ title: "VitaMyStory", text: textToShare }).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(textToShare);
                          alert(t.shareSuccess);
                        }
                      }}
                      className="hover:text-stone-600 transition-colors p-1"
                      title={t.shareStory}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                    {onEdit && (
                      <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="hover:text-stone-600 transition-colors p-1" title="Edit memory">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="hover:text-red-400 transition-colors p-1" title="Delete memory">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-stone-400 tracking-[0.2em] uppercase font-sans">
                    {formatWhen(item.createdAt, lang)}
                  </div>
                  {item.prompt ? (
                    <div className="text-lg text-stone-600 italic font-medium text-center px-4 leading-relaxed max-w-sm font-serif">
                      {renderWithBoldName(item.prompt)}
                    </div>
                  ) : null}
                </div>

                <div className={`flex-1 bg-white p-6 flex flex-col w-full overflow-hidden ${isLong || item.imageUrl ? 'justify-start items-start' : 'justify-center items-center'}`}>
                  {item.imageUrl && (
                    <div className="w-full h-48 mb-4 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 border border-stone-100">
                      <img src={item.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                    </div>
                  )}
                  <div
                    className={`leading-relaxed font-serif px-2 w-full break-words overflow-y-auto no-scrollbar ${item.imageUrl
                        ? (isLong ? 'text-sm text-stone-700' : 'text-lg text-stone-800')
                        : (isLong ? 'text-lg text-stone-700' : 'text-2xl sm:text-3xl text-stone-800 text-center')
                      }`}
                    style={{ maxHeight: '100%' }}
                  >
                    {item.text}
                  </div>
                </div>

                {isActive && items.length > 1 && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                    {items.map((_, dotIdx) => (
                      <div key={dotIdx} className={`h-1 w-1 rounded-full transition-all duration-300 ${dotIdx === i ? "bg-stone-800 w-4" : "bg-stone-200"}`} />
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
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl text-stone-600 hover:text-stone-900 transition-all hover:scale-110 hidden sm:flex items-center justify-center border border-stone-200 opacity-0 group-hover:opacity-100"
          aria-label="Previous story"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      )}
      {index < items.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl text-stone-600 hover:text-stone-900 transition-all hover:scale-110 hidden sm:flex items-center justify-center border border-stone-200 opacity-0 group-hover:opacity-100"
          aria-label="Next story"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      )}
    </div>
  );
}
