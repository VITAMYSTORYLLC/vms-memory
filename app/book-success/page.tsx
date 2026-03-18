"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemory } from "../context/MemoryContext";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

export default function BookSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { people, lang, addNotification } = useMemory();
  const { user } = useAuth();

  const personId = searchParams?.get("personId");
  const personName = searchParams?.get("personName");
  const sessionId = searchParams?.get("session_id");

  const [status, setStatus] = useState<"generating" | "done" | "error">("generating");

  const generate = useCallback(async () => {
    try {
      const person = people.find((p) => p.id === personId);
      const memories = person?.memories ?? [];

      // Record purchase in Firestore (fire and forget)
      if (user && sessionId) {
        try {
          const db = getFirestore();
          await setDoc(
            doc(db, "book_purchases", `${user.uid}_${personId}`),
            {
              uid: user.uid,
              personId,
              personName,
              sessionId,
              purchasedAt: Date.now(),
            },
            { merge: true }
          );
        } catch {
          // Non-blocking — purchase record is optional
        }
      }

      // Generate the PDF
      const { pdf } = await import("@react-pdf/renderer");
      const { BookPdfDocument } = await import("../components/BookPdf");
      const React = (await import("react")).default;

      const publicMemories = memories.filter((m) => !m.isPrivate && m.text?.trim());

      const blob = await pdf(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        React.createElement(BookPdfDocument, {
          person: person ?? {
            id: personId ?? "unknown",
            name: personName ?? "Unknown",
            memories: [],
            createdAt: Date.now(),
          },
          memories: publicMemories,
        }) as any
      ).toBlob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(personName ?? "memory-book").replace(/\s+/g, "-")}-memory-book.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("done");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setStatus("error");
    }
  }, [personId, personName, sessionId, people, user]);

  useEffect(() => {
    if (!personId || !personName) {
      router.replace("/profile");
      return;
    }
    generate();
  }, []);

  const t = {
    generating: lang === "es" ? "Generando tu libro..." : "Generating your book...",
    generatingDesc:
      lang === "es"
        ? "Estamos preparando todas tus historias en un hermoso PDF."
        : "We're compiling all their stories into a beautiful PDF.",
    done: lang === "es" ? "¡Tu libro está listo!" : "Your book is ready!",
    doneDesc:
      lang === "es"
        ? "La descarga debería comenzar automáticamente."
        : "The download should have started automatically.",
    error: lang === "es" ? "Algo salió mal" : "Something went wrong",
    errorDesc:
      lang === "es"
        ? "No se pudo generar el PDF. Contacta a soporte."
        : "We couldn't generate the PDF. Please contact support.",
    backToProfile: lang === "es" ? "Volver al Perfil" : "Back to Profile",
    downloadAgain: lang === "es" ? "Descargar de nuevo" : "Download again",
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-midnight-950 flex items-center justify-center p-6 transition-colors">
      <div className="text-center max-w-sm w-full">
        {status === "generating" && (
          <>
            {/* Book animation */}
            <div className="w-20 h-20 mx-auto mb-8 relative">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <span className="text-4xl animate-bounce">📖</span>
              </div>
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-3">
              {t.generating}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-8">
              {t.generatingDesc}
            </p>
            <div className="flex gap-1 justify-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        )}

        {status === "done" && (
          <>
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-3">
              {t.done}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-8">
              {t.doneDesc}
            </p>
            <div className="space-y-3">
              <button
                onClick={generate}
                className="w-full py-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-sm hover:bg-stone-50 dark:hover:bg-midnight-800 transition-all"
              >
                {t.downloadAgain}
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="w-full py-4 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm hover:bg-stone-800 dark:hover:bg-white transition-all"
              >
                {t.backToProfile}
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-3">
              {t.error}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-8">
              {t.errorDesc}
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="w-full py-4 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm"
            >
              {t.backToProfile}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
