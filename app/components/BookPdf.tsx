"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { Person, MemoryItem } from "../types";

// Register graceful fallback fonts (built-in)
const styles = StyleSheet.create({
  // ── Cover ──────────────────────────────────────────────
  coverPage: {
    backgroundColor: "#1a1a1a",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  coverAccent: {
    width: 60,
    height: 3,
    backgroundColor: "#c9a96e",
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 48,
    fontFamily: "Times-BoldItalic",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 1,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  coverSubtitle: {
    fontSize: 13,
    fontFamily: "Times-Roman",
    color: "#888888",
    textAlign: "center",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 60,
  },
  coverStoryCount: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#555555",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  coverBrand: {
    position: "absolute",
    bottom: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#444444",
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // ── Story Pages ────────────────────────────────────────
  storyPage: {
    backgroundColor: "#faf9f7",
    paddingVertical: 70,
    paddingHorizontal: 70,
    display: "flex",
    flexDirection: "column",
  },
  storyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e0d8",
    paddingBottom: 14,
    marginBottom: 28,
  },
  storyPrompt: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#999999",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  personNameSmall: {
    fontSize: 10,
    fontFamily: "Times-Italic",
    color: "#c9a96e",
    letterSpacing: 1,
  },
  storyText: {
    fontSize: 13,
    fontFamily: "Times-Roman",
    color: "#2c2c2c",
    lineHeight: 1.9,
    flexGrow: 1,
  },
  storyFooter: {
    marginTop: 32,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ede8e0",
    paddingTop: 12,
  },
  storyDate: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#aaaaaa",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  pageNumber: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#cccccc",
    letterSpacing: 1,
  },

  // ── Back Cover ─────────────────────────────────────────
  backPage: {
    backgroundColor: "#1a1a1a",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  backAccent: {
    width: 40,
    height: 2,
    backgroundColor: "#c9a96e",
    marginBottom: 24,
  },
  backQuote: {
    fontSize: 16,
    fontFamily: "Times-BoldItalic",
    color: "#ffffff",
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 1.6,
    marginBottom: 16,
  },
  backBrand: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#555555",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface BookPdfDocProps {
  person: Person;
  /** Only public (non-private) memories */
  memories: MemoryItem[];
}

export function BookPdfDocument({ person, memories }: BookPdfDocProps) {
  const publicMemories = memories.filter((m) => !m.isPrivate && m.text?.trim());

  return (
    <Document
      title={`${person.name} — Memory Book`}
      author="VitaMyStory"
      subject="Family Memory Book"
    >
      {/* ── COVER ── */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverAccent} />
        <Text style={styles.coverTitle}>{person.name}</Text>
        <Text style={styles.coverSubtitle}>A collection of memories</Text>
        <Text style={styles.coverStoryCount}>
          {publicMemories.length} {publicMemories.length === 1 ? "story" : "stories"} preserved
        </Text>
        <Text style={styles.coverBrand}>VitaMyStory</Text>
      </Page>

      {/* ── STORY PAGES ── */}
      {publicMemories.map((memory, idx) => (
        <Page key={memory.id} size="A4" style={styles.storyPage}>
          <View style={styles.storyHeader}>
            {memory.prompt ? (
              <Text style={styles.storyPrompt}>{memory.prompt}</Text>
            ) : null}
            <Text style={styles.personNameSmall}>{person.name}</Text>
          </View>

          <Text style={styles.storyText}>{memory.text}</Text>

          <View style={styles.storyFooter}>
            <Text style={styles.storyDate}>
              {memory.createdAt ? formatDate(memory.createdAt) : ""}
            </Text>
            <Text style={styles.pageNumber}>{idx + 1}</Text>
          </View>
        </Page>
      ))}

      {/* ── BACK COVER ── */}
      <Page size="A4" style={styles.backPage}>
        <View style={styles.backAccent} />
        <Text style={styles.backQuote}>
          "Every story told is a piece of yourself given to the future."
        </Text>
        <Text style={styles.backBrand}>VitaMyStory · vitamystory.com</Text>
      </Page>
    </Document>
  );
}
