'use client';

import React, { useMemo } from 'react';
import { getActiveStage } from '@/lib/frames';

interface HeroOverlayProps {
  progress: number;
  reducedMotion: boolean;
  loadingRatio: number;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  progress,
  reducedMotion,
  loadingRatio,
}) => {
  const activeStage = getActiveStage(progress);

  // Stage counter formatted strings
  const stageCounter = useMemo(() => {
    return String(activeStage).padStart(2, '0');
  }, [activeStage]);

  // Reduced motion: show static Stage 4 layout
  if (reducedMotion) {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-20 flex flex-col justify-between p-6 md:p-12 lg:p-16">
        {/* Top Header / Counter */}
        <div className="flex justify-between items-start w-full">
          <p className="font-serif text-lg tracking-[0.16em] text-[#F3EDE3]">
            Verity Frame Co.
          </p>
          <div className="font-sans text-[14px] tracking-[0.2em] text-[#F3EDE3]/70 font-medium">
            04 / 04
          </div>
        </div>

        {/* Wordmark and Subline on left */}
        <div className="w-full max-w-[540px] md:w-[34vw] my-auto">
          <p
            className="font-serif text-[#F3EDE3] font-normal leading-[1.05] tracking-[0.08em] text-[64px] lg:text-[96px] mb-4"
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Verity Frame Co.
          </p>
          <p
            className="font-sans text-[#F3EDE3]/90 font-normal leading-[1.5] text-[16px] md:text-[18px]"
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Made to last. Ready for every day.
          </p>
        </div>
      </div>
    );
  }

  // Wordmark calculation (stage 4 only, crosses 0.8)
  // Starts at letter spacing 0.4em and opacity 0. As p crosses 0.8, tightens to 0.08em and opacity 1 over 1400ms
  const isStage4 = activeStage === 4;
  const stage4P = Math.max(0, Math.min(1, (progress - 0.75) / 0.25));
  const wordmarkTighten = progress >= 0.8;
  const wordmarkProgress = Math.max(0, Math.min(1, (progress - 0.8) / 0.2));
  const wordmarkOpacity = wordmarkProgress;
  const wordmarkTracking = 0.4 - wordmarkProgress * (0.4 - 0.08); // 0.4em -> 0.08em

  // Scroll cue visibility: stops after p > 0.02
  const showScrollCue = progress <= 0.02;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-20">
      {/* Top Bar: Brand Wordmark (stages 1-3) / Stage Counter (fixed top-right) */}
      <header className="absolute top-8 left-[6vw] right-[6vw] flex justify-between items-center z-30">
        <span className="font-serif text-[18px] tracking-[0.16em] uppercase text-[#F3EDE3]/90">
          Verity Frame Co.
        </span>

        {/* Stage Counter: top-right corner, "01 / 04" in sans face, 14px, letter spacing 0.2em, color #F3EDE3 @ 70% */}
        <div className="font-sans text-[14px] tracking-[0.2em] text-[#F3EDE3]/70 font-medium flex items-center">
          <span className="inline-block transition-opacity duration-400 ease-out">
            {stageCounter}
          </span>
          <span className="ml-1 opacity-70">/ 04</span>
        </div>
      </header>

      {/* Preload hairline in walnut #6B4A2F while frames load */}
      {loadingRatio < 1 && (
        <div className="absolute top-0 left-0 w-full h-[1px] bg-transparent z-40">
          <div
            className="h-full bg-[#6B4A2F] transition-all duration-300 ease-out"
            style={{ width: `${Math.round(loadingRatio * 100)}%` }}
          />
        </div>
      )}

      {/* Subtle vignette/contrast guard on the left edge for WCAG AA readability */}
      <div className="absolute inset-y-0 left-0 w-[45vw] bg-gradient-to-r from-[#14100E]/70 via-[#14100E]/30 to-transparent pointer-events-none" />

      {/* Main Content Area
          Desktop (>= 1024px): left 6vw, width 34vw, vertically centered.
          Mobile (< 768px): text sits in top 35% of viewport.
      */}
      <div className="absolute left-[6vw] top-[14vh] md:top-1/2 md:-translate-y-1/2 w-[88vw] md:w-[34vw] max-w-[540px]">
        {/* Stage 1 */}
        <div
          className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeStage === 1
              ? 'opacity-100 translate-y-0 blur-none relative'
              : 'opacity-0 translate-y-6 blur-[8px] absolute inset-0 pointer-events-none'
          }`}
        >
          <h1
            className="font-serif text-[#F3EDE3] font-normal leading-[1.1] text-[40px] md:text-[56px] lg:text-[72px] mb-3 md:mb-4"
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Made to flex.
          </h1>
          <p
            className={`font-sans text-[#F3EDE3]/90 font-normal leading-[1.5] text-[16px] md:text-[18px] transition-opacity duration-700 delay-300 ${
              activeStage === 1 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Acetate and steel, built to bend.
          </p>

          {/* Scroll cue: thin 40px walnut #6B4A2F line pulsing slowly, opacity 0.3 - 0.8 over 2s cycle. Stops after p > 0.02 */}
          {showScrollCue && (
            <div className="mt-8 flex flex-col items-start gap-2 animate-pulse-line">
              <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#F3EDE3]/60">
                Scroll to explore
              </span>
              <div className="w-10 h-[1px] bg-[#6B4A2F]" />
            </div>
          )}
        </div>

        {/* Stage 2 */}
        <div
          className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeStage === 2
              ? 'opacity-100 translate-y-0 blur-none relative'
              : 'opacity-0 translate-y-6 blur-[8px] absolute inset-0 pointer-events-none'
          }`}
        >
          <h2
            className="font-serif text-[#F3EDE3] font-normal leading-[1.1] text-[40px] md:text-[56px] lg:text-[72px] mb-3 md:mb-4"
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Built true from every side.
          </h2>
          <p
            className={`font-sans text-[#F3EDE3]/90 font-normal leading-[1.5] text-[16px] md:text-[18px] transition-opacity duration-700 delay-300 ${
              activeStage === 2 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Tested from every angle.
          </p>
        </div>

        {/* Stage 3 */}
        <div
          className={`transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeStage === 3
              ? 'opacity-100 translate-y-0 blur-none relative'
              : 'opacity-0 translate-y-6 blur-[8px] absolute inset-0 pointer-events-none'
          }`}
        >
          <h2
            className="font-serif text-[#F3EDE3] font-normal leading-[1.1] text-[40px] md:text-[56px] lg:text-[72px] mb-3 md:mb-4"
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Back to shape.
          </h2>
          <p
            className={`font-sans text-[#F3EDE3]/90 font-normal leading-[1.5] text-[16px] md:text-[18px] transition-opacity duration-700 delay-300 ${
              activeStage === 3 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Built to last for years.
          </p>
        </div>

        {/* Stage 4: Wordmark Reveal */}
        <div
          className={`transition-all duration-1400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isStage4
              ? 'opacity-100 translate-y-0 relative'
              : 'opacity-0 translate-y-6 absolute inset-0 pointer-events-none'
          }`}
        >
          <p
            className="font-serif text-[#F3EDE3] font-normal leading-[1.05] text-[64px] md:text-[80px] lg:text-[96px] mb-3 md:mb-4 transition-all duration-1400 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              letterSpacing: `${wordmarkTracking}em`,
              opacity: Math.max(0.1, wordmarkOpacity),
              textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            Verity Frame Co.
          </p>
          <p
            className={`font-sans text-[#F3EDE3]/90 font-normal leading-[1.5] text-[16px] md:text-[18px] transition-opacity duration-700 delay-300 ${
              isStage4 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ textShadow: '0 2px 24px rgba(0, 0, 0, 0.4)' }}
          >
            Made to last. Ready for every day.
          </p>
        </div>
      </div>
    </div>
  );
};
