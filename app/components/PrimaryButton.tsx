import React from "react";

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full py-4 rounded-xl bg-stone-900 text-stone-50 font-sans font-medium tracking-wide shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none hover:bg-stone-800 ${className}`}
    >
      {children}
    </button>
  );
}
