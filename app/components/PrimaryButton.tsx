import React from "react";

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-4 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium tracking-wide shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-40 hover:bg-stone-800 dark:hover:bg-white ${className}`}
    >
      {children}
    </button>
  );
}
