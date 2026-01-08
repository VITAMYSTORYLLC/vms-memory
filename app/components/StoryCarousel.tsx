import React, { useState, useEffect } from "react";
import { MemoryItem, Lang } from "../types";
import { TEXT } from "../constants";
import { formatWhen } from "../utils";
import { renderWithBoldName } from "../utils/text";
import { useSwipe } from "../hooks/useSwipe";
import { ArrowButton } from "./ArrowButton";

interface StoryCarouselProps {
  items: MemoryItem[];
  lang: Lang;
  onDelete: (id: string) => void;
  onEdit: (item: MemoryItem) => void;
}

export function StoryCarousel({ items, lang, onDelete, onEdit }: StoryCarouselProps) {
  const [index, setIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const t = TEXT[lang];

  function prev() { setShowDeleteConfirm(false); setIndex((i) => (i === 0 ? items.length - 1 : i - 1)); }
  function next() { setShowDeleteConfirm(false); setIndex((i) => (i === items.length - 1 ? 0 : i + 1)); }
  const swipeHandlers = useSwipe(next, prev);

  useEffect(() => {
    if (items.length <= 0) return;
    setIndex((i) => Math.max(0, Math.min(i, items.length - 1)));
  }, [items.length]);

  const current = items[index];
  if (!current) return null;

  // SMART SIZING: Low threshold (70) so multi-line text moves to clean left-align quickly.
  const isLong = current.text.length > 70;

  return (
    <div className="relative">
      <div
        {...swipeHandlers}
        className="bg-white border border-stone-200 shadow-sm rounded-xl h-[600px] flex flex-col relative touch-pan-y overflow-hidden transition-all"
      >
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 font-sans">
            <h3 className="text-xl font-bold text-stone-900 mb-2">{t.confirmDeleteTitle}</h3>
            <p className="text-sm text-stone-500 mb-6 text-center">{t.confirmDeleteBody}</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-stone-100 rounded-lg text-stone-600 font-medium hover:bg-stone-200 transition-colors">{t.cancel}</button>
              <button onClick={() => { onDelete(current.id); setShowDeleteConfirm(false); }} className="flex-1 py-3 bg-red-50 rounded-lg text-red-600 font-medium hover:bg-red-100 transition-colors">{t.confirm}</button>
            </div>
          </div>
        )}

        <div className="bg-stone-100 w-full px-6 py-8 flex flex-col items-center space-y-4 border-b border-stone-200 relative flex-shrink-0">
          <div className="absolute top-4 right-4 flex gap-3 text-stone-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const textToShare = `${renderWithBoldName(current.prompt)}\n\n"${current.text}"\n\n— via VitaMyStory`;
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
            <button onClick={(e) => { e.stopPropagation(); onEdit(current); }} className="hover:text-stone-600 transition-colors p-1" title="Edit memory">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="hover:text-red-400 transition-colors p-1" title="Delete memory">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
          <div className="text-[10px] font-bold text-stone-400 tracking-[0.2em] uppercase font-sans">
            {formatWhen(current.createdAt, lang)}
          </div>
          {current.prompt ? (
            <div className="text-lg text-stone-500 italic font-medium text-center px-4 leading-relaxed max-w-sm font-serif">
              {renderWithBoldName(current.prompt)}
            </div>
          ) : null}
        </div>

        <div className={`flex-1 bg-white p-8 flex flex-col w-full overflow-hidden ${isLong ? 'justify-start items-start' : 'justify-center items-center'}`}>
          {current.imageUrl && (
            <div className="w-full h-48 mb-6 rounded-lg overflow-hidden shadow-sm flex-shrink-0 border border-stone-100">
              <img src={current.imageUrl} className="w-full h-full object-cover" alt="Memory" />
            </div>
          )}
          <div className={`leading-relaxed font-serif px-2 w-full break-words overflow-y-auto ${isLong ? 'text-lg text-left text-stone-700' : 'text-2xl sm:text-3xl text-center text-stone-800'}`} style={{ maxHeight: '100%' }}>
            {current.text}
          </div>
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {items.map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${i === index ? "bg-stone-400 scale-110" : "bg-stone-200"}`} />
            ))}
          </div>
        )}
      </div>
      <div className="absolute -left-5 top-1/2 -translate-y-1/2 z-20"><ArrowButton direction="left" onClick={prev} disabled={false} /></div>
      <div className="absolute -right-5 top-1/2 -translate-y-1/2 z-20"><ArrowButton direction="right" onClick={next} disabled={false} /></div>
    </div>
  );
}
