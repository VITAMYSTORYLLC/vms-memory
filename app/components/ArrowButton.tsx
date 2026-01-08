import React from "react";

export function ArrowButton({ direction, onClick, disabled }: { direction: "left" | "right", onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 text-stone-300 hover:text-stone-600 disabled:opacity-0 transition-colors hidden sm:block ${direction === "left" ? "-ml-2" : "-mr-2"}`}
    >
      <span className="text-2xl font-sans">{direction === "left" ? "←" : "→"}</span>
    </button>
  );
}
