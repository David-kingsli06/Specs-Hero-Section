'use client';

import React from 'react';
import { BRAND, STAGES } from '@/lib/stages';

interface OverlayTextProps {
  progress: number;
  reducedMotion: boolean;
}

// Ease curves
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

/**
 * Calculates opacity and translateY for a stage text
 * Stage text fades in over first 0.5 units of its stage with 12px upward translate (easeOutCubic)
 * Fades out over last 0.2 units (easeInCubic)
 * Animate only transform and opacity
 */
function getStageTextStyle(stageIdx: number, progress: number, reducedMotion: boolean) {
  const stage = STAGES[stageIdx];
  const [start, end] = stage.range;
  const stageLength = end - start;

  if (progress < start || progress > end) {
    // If before first stage or at start
    if (stageIdx === 0 && progress <= 0) {
      return { opacity: 1, transform: 'translateY(0px)' };
    }
    // If at end of last stage
    if (stageIdx === 2 && progress >= 1) {
      return { opacity: 1, transform: 'translateY(0px)' };
    }
    return { opacity: 0, transform: reducedMotion ? 'none' : 'translateY(12px)', pointerEvents: 'none' as const };
  }

  if (reducedMotion) {
    return { opacity: 1, transform: 'none' };
  }

  const localP = (progress - start) / stageLength; // 0 to 1

  let opacity = 1;
  let translateY = 0;

  // In Stage 1 starting state (p=0), text is already visible on screen
  if (stageIdx === 0) {
    if (localP > 0.8) {
      // Fade out over last 0.2 units
      const outP = (localP - 0.8) / 0.2;
      opacity = 1 - easeInCubic(outP);
      translateY = -12 * easeInCubic(outP);
    } else {
      opacity = 1;
      translateY = 0;
    }
  } else if (stageIdx === 2) {
    // Stage 3 holds at end (p=1)
    if (localP < 0.5) {
      const inP = localP / 0.5;
      opacity = easeOutCubic(inP);
      translateY = 12 * (1 - easeOutCubic(inP));
    } else {
      opacity = 1;
      translateY = 0;
    }
  } else {
    // Stage 2
    if (localP < 0.5) {
      const inP = localP / 0.5;
      opacity = easeOutCubic(inP);
      translateY = 12 * (1 - easeOutCubic(inP));
    } else if (localP > 0.8) {
      const outP = (localP - 0.8) / 0.2;
      opacity = 1 - easeInCubic(outP);
      translateY = -12 * easeInCubic(outP);
    } else {
      opacity = 1;
      translateY = 0;
    }
  }

  return {
    opacity: Math.max(0, Math.min(1, opacity)),
    transform: `translateY(${translateY}px)`,
    transition: reducedMotion ? 'opacity 0.4s ease' : 'none',
  };
}

export const OverlayText: React.FC<OverlayTextProps> = ({ progress, reducedMotion }) => {
  const showScrollCue = progress <= 0.05;

  return (
    <>
      {/* Header, always visible, top-left: "Verity Frame Co." Small uppercase, letter-spacing 0.24em, 12px */}
      <header className="absolute top-8 left-8 md:top-12 md:left-16 z-30 pointer-events-auto">
        <span className="font-sans text-[12px] uppercase tracking-[0.24em] font-medium text-[#F3EDE3]/90 select-none">
          {BRAND.name}
        </span>
      </header>

      {/* Text Column Container: vertically centered, max-width 520px */}
      <div className="relative w-full max-w-[520px] pointer-events-none select-none">
        {STAGES.map((stage, idx) => {
          const style = getStageTextStyle(idx, progress, reducedMotion);
          return (
            <div
              key={stage.id}
              className={`transition-opacity duration-300 ${idx === 0 ? 'relative' : 'absolute inset-0'}`}
              style={style}
            >
              <h1 className="font-serif text-[#F3EDE3] font-normal leading-[1.1] tracking-[-0.01em] text-[clamp(2.25rem,4.6vw,4.5rem)] mb-4 md:mb-5">
                {stage.headline}
              </h1>
              <h2 className="font-sans text-[#F3EDE3]/85 font-normal leading-[1.5] text-[clamp(0.95rem,1.2vw,1.125rem)]">
                {stage.subline}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Scroll cue, bottom-center, visible until p > 0.05: "Scroll to flex."
          Thin 1px line that moves down 12px and fades in 2.4s loop with easeInOutSine */}
      <div
        aria-hidden="true"
        className={`absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-500 z-30 ${
          showScrollCue ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#F3EDE3]/70 font-medium">
          Scroll to flex
        </span>
        <div className="w-[1px] h-6 relative overflow-hidden bg-[#F3EDE3]/20">
          <div className="w-full h-3 bg-[#F3EDE3]/80 absolute top-0 animate-scroll-line" />
        </div>
      </div>
    </>
  );
};
