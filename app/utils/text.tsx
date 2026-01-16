import React from "react";

export function renderWithBoldName(text: string) {
  if (!text) return null;
  const parts = text.split("|||");
  if (parts.length === 1) return parts[0];
  if (parts.length < 3) return text;
  return <>{parts[0]}<span className="font-bold text-stone-900 dark:text-stone-100">{parts[1]}</span>{parts[2]}</>;
}

export function stripBoldMarkers(text: string) {
  if (!text) return "";
  return text.split("|||").join("");
}

