'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { FrameCanvas } from './FrameCanvas';
import { HeroOverlay } from './HeroOverlay';
import { useReducedMotion } from '@/lib/useReducedMotion';

// 4 discrete stages:
// Stage 1: p = 0.00 (frame 0)
// Stage 2: p = 0.3333 (frame 64)
// Stage 3: p = 0.6666 (frame 127)
// Stage 4: p = 1.00 (frame 191)
const STAGE_TARGETS = [0.0, 0.3333, 0.6666, 1.0];

export const Hero: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadingRatio, setLoadingRatio] = useState(0);
  const [firstDecoded, setFirstDecoded] = useState(false);
  const [posterRemoved, setPosterRemoved] = useState(false);

  const reducedMotion = useReducedMotion();
  const isTransitioningRef = useRef(false);

  // Smoothly transition progress to stage target
  const goToStage = (targetStageIdx: number) => {
    const nextIdx = Math.max(0, Math.min(STAGE_TARGETS.length - 1, targetStageIdx));
    setActiveStageIndex(nextIdx);
    const targetP = STAGE_TARGETS[nextIdx];
    setProgress(targetP);
  };

  // Wheel and Touch gesture handling: 1 scroll/swipe = advance to next stage smoothly
  useEffect(() => {
    if (reducedMotion) return;

    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      // Threshold to distinguish deliberate scroll from trackpad jitter
      if (Math.abs(e.deltaY) < 25 || isTransitioningRef.current) return;

      if (e.deltaY > 0) {
        // Scroll down -> next stage
        isTransitioningRef.current = true;
        setActiveStageIndex((prev) => {
          const next = Math.min(STAGE_TARGETS.length - 1, prev + 1);
          setProgress(STAGE_TARGETS[next]);
          return next;
        });
      } else {
        // Scroll up -> previous stage
        isTransitioningRef.current = true;
        setActiveStageIndex((prev) => {
          const next = Math.max(0, prev - 1);
          setProgress(STAGE_TARGETS[next]);
          return next;
        });
      }

      // Debounce window to allow clean, smooth glide per scroll
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 750);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioningRef.current || e.changedTouches.length === 0) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;

      if (Math.abs(diffY) > 40) {
        isTransitioningRef.current = true;
        if (diffY > 0) {
          // Swipe up -> scroll down -> next stage
          setActiveStageIndex((prev) => {
            const next = Math.min(STAGE_TARGETS.length - 1, prev + 1);
            setProgress(STAGE_TARGETS[next]);
            return next;
          });
        } else {
          // Swipe down -> scroll up -> prev stage
          setActiveStageIndex((prev) => {
            const next = Math.max(0, prev - 1);
            setProgress(STAGE_TARGETS[next]);
            return next;
          });
        }

        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 750);
      }
    };

    // Keyboard ArrowDown / ArrowUp navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        isTransitioningRef.current = true;
        setActiveStageIndex((prev) => {
          const next = Math.min(STAGE_TARGETS.length - 1, prev + 1);
          setProgress(STAGE_TARGETS[next]);
          return next;
        });
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 750);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        isTransitioningRef.current = true;
        setActiveStageIndex((prev) => {
          const next = Math.max(0, prev - 1);
          setProgress(STAGE_TARGETS[next]);
          return next;
        });
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 750);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reducedMotion]);

  // Remove poster from DOM after initial frames draw
  useEffect(() => {
    if (firstDecoded) {
      const timer = setTimeout(() => {
        setPosterRemoved(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [firstDecoded]);

  return (
    <section
      aria-label="Verity Frame Co. hero"
      className="fixed inset-0 w-full h-full overflow-hidden bg-[#14100E] select-none"
    >
      {/* Poster image: displayed immediately on page load */}
      {!posterRemoved && (
        <div
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-600 ease-out z-0 ${
            firstDecoded && !reducedMotion ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="relative w-full h-full scale-[1.04]">
            <Image
              src="/verity_poster_16x9.jpg"
              alt="Verity Frame Co. Sunglasses"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* 192-Frame Sequence Canvas */}
      <FrameCanvas
        progress={progress}
        reducedMotion={reducedMotion}
        onFirstFramesDecoded={() => setFirstDecoded(true)}
        onLoadingProgress={(ratio) => setLoadingRatio(ratio)}
      />

      {/* Text & Stage Overlay */}
      <HeroOverlay
        progress={progress}
        reducedMotion={reducedMotion}
        loadingRatio={loadingRatio}
      />

      {/* Interactive stage navigation dots (Taste / Impeccable Design) */}
      <nav
        aria-label="Hero stages"
        className="absolute bottom-8 right-8 md:right-16 z-30 flex items-center gap-3 pointer-events-auto"
      >
        {STAGE_TARGETS.map((targetP, idx) => (
          <button
            key={idx}
            onClick={() => goToStage(idx)}
            aria-label={`Go to stage ${idx + 1}`}
            className={`transition-all duration-400 rounded-full cursor-pointer ${
              activeStageIndex === idx
                ? 'w-6 h-1.5 bg-[#E8E2D6]'
                : 'w-1.5 h-1.5 bg-[#F3EDE3]/30 hover:bg-[#F3EDE3]/60'
            }`}
          />
        ))}
      </nav>
    </section>
  );
};
