import React from "react";

export function ArrowButton({ direction, onClick, disabled }: { direction: "left" | "right", onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 sm:p-4 bg-white/80 backdrop-blur-sm shadow-sm border border-stone-200/50 rounded-full text-stone-600 hover:text-stone-900 hover:scale-110 disabled:opacity-0 transition-all ${direction === "left" ? "ml-2" : "mr-2"}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 sm:w-6 sm:h-6"
      >
        {direction === "left" ? (
          <polyline points="15 18 9 12 15 6"></polyline>
        ) : (
          <polyline points="9 18 15 12 9 6"></polyline>
        )}
      </svg>
    </button>
  );
}
