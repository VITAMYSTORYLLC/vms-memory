import React from "react";
import { Haptics } from "@/utils/haptics";

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!rest.disabled) Haptics.medium();
        if (rest.onClick) rest.onClick(e);
      }}
      className={`w-full py-4 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium tracking-wide shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-40 hover:bg-stone-800 dark:hover:bg-white ${className}`}
    >
      {children}
    </button>
  );
}
