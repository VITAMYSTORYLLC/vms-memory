import React from "react";

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 font-sans font-medium shadow-sm hover:shadow-md active:scale-[0.98] transition-all hover:border-stone-300 dark:hover:border-stone-700 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-50 disabled:bg-stone-50 dark:disabled:bg-stone-900/50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
