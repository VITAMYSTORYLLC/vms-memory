"use client";

import React, { useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import { BookPdfDocument } from "../components/BookPdf";
import { useMemory } from "../context/MemoryContext";

// Sample data for when there are no real stories
const SAMPLE_PERSON = {
  id: "preview",
  name: "Grandma Elvia",
  memories: [],
  createdAt: Date.now(),
};

const SAMPLE_MEMORIES = [
  {
    id: "1",
    prompt: "What's the first memory that comes to mind?",
    text: "I remember the smell of her kitchen every Sunday morning — warm corn tortillas, fresh salsa, and the sound of her humming her favorite song. She never needed a recipe. Everything was in her hands.",
    createdAt: new Date("1985-06-15").getTime(),
    isPrivate: false,
    isAudioStory: false,
  },
  {
    id: "2",
    prompt: "What mattered most to this person?",
    text: "Her family was everything. She would wake up at 5am just to have breakfast ready before anyone else was even awake. She never said 'I love you' in words — she said it in every meal, every hug, every moment of patience.",
    createdAt: new Date("1990-03-22").getTime(),
    isPrivate: false,
    isAudioStory: false,
  },
  {
    id: "3",
    prompt: "What's something you want everyone to know about them?",
    text: "She raised seven children, worked two jobs, and still found time to tend her garden. She never complained once. She always said 'each day is a gift — don't waste it being sad.' I try to live by that every single day.",
    createdAt: new Date("1995-11-08").getTime(),
    isPrivate: false,
    isAudioStory: false,
  },
];

export default function BookPreviewPage() {
  const { people, lang } = useMemory();
  const [useSample, setUseSample] = useState(false);

  const realPerson = people[0];
  const realMemories = realPerson?.memories?.filter((m) => !m.isPrivate && m.text?.trim()) ?? [];
  const hasRealData = realPerson && realMemories.length > 0;

  const previewPerson = useSample || !hasRealData ? SAMPLE_PERSON : realPerson;
  const previewMemories = useSample || !hasRealData ? SAMPLE_MEMORIES as any : realMemories;

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
        <div>
          <h1 className="text-white font-serif font-bold text-lg">Memory Book Preview</h1>
          <p className="text-stone-400 text-xs mt-0.5">
            {hasRealData
              ? `Showing ${realMemories.length} public stories for ${realPerson.name}`
              : "No stories yet — showing sample layout"}
          </p>
        </div>

        {hasRealData && (
          <button
            onClick={() => setUseSample(!useSample)}
            className="text-xs text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-lg hover:bg-amber-400/10 transition-all"
          >
            {useSample ? "Use my real stories" : "Show sample layout"}
          </button>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1">
        <PDFViewer
          style={{ width: "100%", height: "calc(100vh - 72px)", border: "none" }}
          showToolbar={true}
        >
          <BookPdfDocument
            person={previewPerson as any}
            memories={previewMemories}
          />
        </PDFViewer>
      </div>
    </div>
  );
}
