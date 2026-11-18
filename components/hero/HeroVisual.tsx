'use client';

import React from 'react';
import { ScrubVideo } from './ScrubVideo';
import { SunglassesScene } from './SunglassesScene';
import { STAGES, CROSSFADE_DURATION } from '@/lib/stages';

interface HeroVisualProps {
  progress: number;
  dampedProgress: number;
  isStationary: boolean;
  reducedMotion: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
  dpr: [number, number];
}

/**
 * Calculates sine.inOut cross-fade between 0 and 1 over a given span
 */
function sineInOut(t: number): number {
  return 0.5 * (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t))));
}

export const HeroVisual: React.FC<HeroVisualProps> = ({
  progress,
  dampedProgress,
  isStationary,
  reducedMotion,
  isLowEnd,
  isMobile,
  dpr,
}) => {
  const p = dampedProgress;

  // STAGE OPACITIES & CROSS-FADES
  // Stage 1: p 0 to 0.33
  // Stage 2: p 0.33 to 0.66 (cross-fade over first 0.08 units of stage 2: [0.33, 0.41])
  // Stage 3: p 0.66 to 1.0 (cross-fade over first 0.08 units of stage 3: [0.66, 0.74])

  let stage1Opacity = 1;
  let stage2Opacity = 0;
  let stage3Opacity = 0;

  if (p < 0.33) {
    stage1Opacity = 1;
    stage2Opacity = 0;
    stage3Opacity = 0;
  } else if (p >= 0.33 && p < 0.33 + CROSSFADE_DURATION) {
    // Crossfade 1 -> 2
    const blend = sineInOut((p - 0.33) / CROSSFADE_DURATION);
    stage1Opacity = 1 - blend;
    stage2Opacity = blend;
    stage3Opacity = 0;
  } else if (p >= 0.33 + CROSSFADE_DURATION && p < 0.66) {
    stage1Opacity = 0;
    stage2Opacity = 1;
    stage3Opacity = 0;
  } else if (p >= 0.66 && p < 0.66 + CROSSFADE_DURATION) {
    // Crossfade 2 -> 3
    const blend = sineInOut((p - 0.66) / CROSSFADE_DURATION);
    stage1Opacity = 0;
    stage2Opacity = 1 - blend;
    stage3Opacity = blend;
  } else {
    stage1Opacity = 0;
    stage2Opacity = 0;
    stage3Opacity = 1;
  }

  // Map progress into each video's 0 to 1 clip duration
  // Video 1 scrubs across [0, 0.33]
  const video1Progress = Math.min(1, Math.max(0, p / 0.33));
  // Video 2 scrubs across [0.33, 0.66]
  const video2Progress = Math.min(1, Math.max(0, (p - 0.33) / 0.33));

  const stage1Config = STAGES[0];
  const stage2Config = STAGES[1];

  const video1Src = isMobile
    ? stage1Config.videoMobile!
    : stage1Config.videoDesktop!;
  const video2Src = isMobile
    ? stage2Config.videoMobile!
    : stage2Config.videoDesktop!;

  return (
    <div
      role="img"
      aria-label="Verity Frame Co. sunglasses, flexing from acetate to steel and settling back to shape as you scroll."
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >
      {/* Fallback / ambient background: soft radial gradient (#2A211D center to #14100E edge) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #2A211D 0%, #14100E 100%)',
        }}
      />

      {/* Stage 1: Hand flex video */}
      {stage1Opacity > 0 && (
        <ScrubVideo
          src={video1Src}
          poster={stage1Config.poster!}
          progress={video1Progress}
          opacity={stage1Opacity}
          isActive={p < 0.45}
          reducedMotion={reducedMotion}
          isLowEnd={isLowEnd}
        />
      )}

      {/* Stage 2: Rotation video */}
      {stage2Opacity > 0 && (
        <ScrubVideo
          src={video2Src}
          poster={stage2Config.poster!}
          progress={video2Progress}
          opacity={stage2Opacity}
          isActive={p >= 0.28 && p < 0.75}
          reducedMotion={reducedMotion}
          isLowEnd={isLowEnd}
        />
      )}

      {/* Stage 3: 3D Sunglasses */}
      {stage3Opacity > 0 && (
        <SunglassesScene
          progress={p}
          opacity={stage3Opacity}
          isStationary={isStationary}
          reducedMotion={reducedMotion}
          isLowEnd={isLowEnd}
          isMobile={isMobile}
          dpr={dpr}
        />
      )}
    </div>
  );
};
