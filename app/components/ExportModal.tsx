"use client";

import React, { useState, useCallback } from "react";
import { FiDownload, FiBook, FiX, FiCheck } from "react-icons/fi";
import { Person, MemoryItem } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  memories: MemoryItem[];
  lang: "en" | "es";
  userName: string;
  hasPurchasedBook: boolean;
  onDownloadBackup: () => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  person,
  memories,
  lang,
  userName,
  hasPurchasedBook,
  onDownloadBackup,
}: ExportModalProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    title: lang === "es" ? "Exportar Colección" : "Export Collection",
    backupLabel: lang === "es" ? "Respaldo de Datos" : "Data Backup",
    backupDesc:
      lang === "es"
        ? "Exporta todas tus historias en formato JSON"
        : "Export all your stories as a JSON file",
    bookLabel: lang === "es" ? "Libro de Recuerdos PDF" : "Memory Book PDF",
    bookDesc:
      lang === "es"
        ? "Un libro hermoso con todas tus historias"
        : "A beautifully formatted book of all their stories",
    bookBadge:
      lang === "es" ? "Descarga única · $2.99" : "One-time download · $2.99",
    redownload:
      lang === "es" ? "Volver a descargar gratis" : "Re-download for free",
    purchased: lang === "es" ? "Ya adquirido ✓" : "Already purchased ✓",
    getBook: lang === "es" ? "Obtener Libro ($2.99)" : "Get Book ($2.99)",
    downloading: lang === "es" ? "Generando PDF..." : "Generating PDF...",
    redirecting: lang === "es" ? "Redirigiendo..." : "Redirecting to payment...",
    free: lang === "es" ? "Gratis" : "Free",
    publicStories: lang === "es"
      ? (n: number) => `${n} historias ${n === 1 ? "pública" : "públicas"}`
      : (n: number) => `${n} public ${n === 1 ? "story" : "stories"}`,
  };

  const publicMemories = memories.filter((m) => !m.isPrivate && m.text?.trim());

  const handleGetBook = useCallback(async () => {
    if (!person) return;

    if (hasPurchasedBook) {
      // Already purchased — generate PDF directly
      setPdfLoading(true);
      try {
        const { pdf } = await import("@react-pdf/renderer");
        const { BookPdfDocument } = await import("./BookPdf");
        const React = (await import("react")).default;
        const blob = await pdf(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          React.createElement(BookPdfDocument, {
            person,
            memories: publicMemories,
          }) as any
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${person.name.replace(/\s+/g, "-")}-memory-book.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
      } catch (err) {
        console.error(err);
        setError(lang === "es" ? "Error al generar el PDF." : "Failed to generate PDF.");
      } finally {
        setPdfLoading(false);
      }
      return;
    }

    // New purchase — redirect to Stripe Checkout
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-book-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: person.id,
          personName: person.name,
          userName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "No checkout URL");
      window.location.href = data.url;
    } catch (err: any) {
      setError(
        err.message || (lang === "es"
          ? "No se pudo iniciar el pago. Inténtalo de nuevo."
          : "Couldn't start payment. Please try again.")
      );
      setCheckoutLoading(false);
    }
  }, [person, hasPurchasedBook, publicMemories, userName, lang, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white dark:bg-midnight-900 rounded-t-[2rem] shadow-2xl px-6 pt-6 pb-10 safe-bottom">
          {/* Handle */}
          <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mb-6" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {t.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-midnight-800 transition-all"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {/* ── Free: JSON Backup ── */}
            <button
              onClick={() => { onDownloadBackup(); onClose(); }}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-midnight-800 transition-all text-left group"
            >
              <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-midnight-800 flex items-center justify-center shrink-0 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-colors">
                <FiDownload size={18} className="text-stone-600 dark:text-stone-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    {t.backupLabel}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    {t.free}
                  </span>
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-snug">
                  {t.backupDesc}
                </p>
              </div>
            </button>

            {/* ── Premium: PDF Book ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 to-stone-700 dark:from-stone-800 dark:to-stone-950 p-px">
              <div className="bg-gradient-to-br from-[#2c2520] to-[#1a1612] rounded-[calc(1rem-1px)] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <FiBook size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">
                        {t.bookLabel}
                      </span>
                      {hasPurchasedBook && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                          <FiCheck size={10} />
                          {t.purchased}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 leading-snug mb-3">
                      {t.bookDesc}
                    </p>

                    {/* Story count */}
                    <p className="text-[10px] text-stone-500 uppercase tracking-[0.15em] mb-4">
                      {t.publicStories(publicMemories.length)}
                      {" · "}
                      {hasPurchasedBook ? t.redownload : t.bookBadge}
                    </p>

                    {/* CTA */}
                    <button
                      onClick={handleGetBook}
                      disabled={checkoutLoading || pdfLoading || publicMemories.length === 0}
                      className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {checkoutLoading
                        ? t.redirecting
                        : pdfLoading
                        ? t.downloading
                        : hasPurchasedBook
                        ? <><FiDownload size={14} />{t.redownload}</>
                        : t.getBook
                      }
                    </button>

                    {error && (
                      <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
