'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface MilestoneData {
  id: string;        // badge ID e.g. "story_keeper"
  icon: string;      // emoji icon
  title: string;     // e.g. "Story Keeper"
  subtitle: string;  // e.g. "5 memories saved"
  color: string;     // Tailwind gradient class
  personName?: string;
}

interface Props {
  milestone: MilestoneData | null;
  onDismiss: () => void;
}

// Pure CSS confetti particle
function Particle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <div
      className="absolute top-0 w-2 h-2 rounded-full opacity-0"
      style={{
        left: `${x}%`,
        backgroundColor: color,
        animation: `confetti-fall 2.2s ease-in ${delay}s forwards`,
      }}
    />
  );
}

const COLORS = ['#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6', '#F97316', '#EC4899'];

export default function MilestoneCelebration({ milestone, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate stable particles
  const particles = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      x: Math.random() * 100,
      delay: Math.random() * 1.2,
      color: COLORS[i % COLORS.length],
    }))
  );

  useEffect(() => {
    if (!milestone) return;
    setLeaving(false);
    setVisible(true);

    // Auto-dismiss after 4.5s
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 4500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [milestone?.id]);

  function handleDismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 500);
  }

  if (!milestone || !visible) return null;

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-10px) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(720deg) scale(0.4); opacity: 0; }
        }
        @keyframes milestone-rise {
          0%   { transform: translateY(60px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1);     opacity: 1; }
        }
        @keyframes milestone-leave {
          0%   { transform: scale(1)    opacity: 1; }
          100% { transform: scale(1.05) opacity: 0; }
        }
        @keyframes icon-pop {
          0%   { transform: scale(0.4) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 1;   }
          100% { opacity: 0.4; }
        }
        @keyframes progress-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Full-screen backdrop */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
        onClick={handleDismiss}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.97) 100%)',
          animation: leaving
            ? 'milestone-leave 0.5s ease-in forwards'
            : 'milestone-rise 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* Confetti layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.current.map((p, i) => (
            <Particle key={i} x={p.x} delay={p.delay} color={p.color} />
          ))}
        </div>

        {/* Card */}
        <div className="relative flex flex-col items-center text-center px-8 max-w-sm w-full select-none">

          {/* Glow ring behind icon */}
          <div
            className="absolute w-48 h-48 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)',
              animation: 'shimmer 2s ease-in-out infinite',
              top: '-24px',
            }}
          />

          {/* Badge icon */}
          <div
            className="text-8xl mb-6 relative z-10"
            style={{ animation: 'icon-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
          >
            {milestone.icon}
          </div>

          {/* "MILESTONE UNLOCKED" label */}
          <p
            className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-400 mb-3"
            style={{ animation: 'milestone-rise 0.5s ease 0.4s both' }}
          >
            Milestone Unlocked
          </p>

          {/* Title */}
          <h1
            className="text-4xl font-serif font-bold text-white mb-2 leading-tight"
            style={{ animation: 'milestone-rise 0.5s ease 0.5s both' }}
          >
            {milestone.title}
          </h1>

          {/* Subtitle */}
          <p
            className="text-stone-400 font-serif italic text-lg mb-2"
            style={{ animation: 'milestone-rise 0.5s ease 0.6s both' }}
          >
            {milestone.subtitle}
          </p>

          {/* Person name if applicable */}
          {milestone.personName && (
            <p
              className="text-amber-400/70 text-sm font-sans uppercase tracking-widest font-bold mb-8"
              style={{ animation: 'milestone-rise 0.5s ease 0.65s both' }}
            >
              for {milestone.personName}
            </p>
          )}

          {/* Divider */}
          <div
            className="w-12 h-px bg-stone-700 mb-8"
            style={{ animation: 'milestone-rise 0.5s ease 0.7s both' }}
          />

          {/* Tap to continue */}
          <p
            className="text-stone-600 text-xs uppercase tracking-[0.25em] font-bold"
            style={{ animation: 'milestone-rise 0.5s ease 0.8s both' }}
          >
            tap anywhere to continue
          </p>

          {/* Auto-dismiss progress bar */}
          <div
            className="absolute bottom-[-48px] left-0 h-0.5 bg-amber-400/40 rounded-full"
            style={{
              animation: 'progress-bar 4.5s linear forwards',
              width: '100%',
            }}
          />
        </div>
      </div>
    </>
  );
}
