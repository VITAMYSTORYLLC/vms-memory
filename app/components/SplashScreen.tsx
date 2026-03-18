"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if we've already shown the splash screen in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    
    if (!hasSeenSplash) {
      setIsVisible(true);
      
      // Start fade out after 1.2 seconds, to give entry animation time to finish
      const timerBase = setTimeout(() => {
        setIsFadingOut(true);
      }, 1200);

      // Remove from DOM after fade out completes (500ms)
      const timerRemove = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("hasSeenSplash", "true");
      }, 1700);

      return () => {
        clearTimeout(timerBase);
        clearTimeout(timerRemove);
      };
    }
  }, []);

  if (!isMounted || !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#F9F8F6] dark:bg-midnight-950 transition-opacity duration-500 ease-in-out ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src="/logo-transparent.png"
        alt="Vita My Story"
        className="w-48 h-auto object-contain animate-in fade-in zoom-in duration-700 mix-blend-multiply dark:hidden"
      />
      <img
        src="/logo-dark.png"
        alt="Vita My Story"
        className="w-48 h-auto object-contain animate-in fade-in zoom-in duration-700 hidden dark:block mix-blend-screen"
      />
    </div>
  );
}
