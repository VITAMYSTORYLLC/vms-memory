import React from "react";

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-4 rounded-xl border border-stone-200 bg-white text-stone-600 font-sans font-medium shadow-sm active:scale-[0.98] transition-all hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50 disabled:bg-stone-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
