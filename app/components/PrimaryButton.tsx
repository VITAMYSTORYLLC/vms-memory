import React from "react";

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-4 rounded-xl bg-stone-900 text-stone-50 font-sans font-medium tracking-wide shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}
