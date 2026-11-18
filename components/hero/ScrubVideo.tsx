'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

interface ScrubVideoProps {
  src: string;
  poster: string;
  progress: number; // 0 to 1 progress within this video's stage
  opacity: number;
  isActive: boolean;
  reducedMotion: boolean;
  isLowEnd: boolean;
}

export const ScrubVideo: React.FC<ScrubVideoProps> = ({
  src,
  poster,
  progress,
  opacity,
  isActive,
  reducedMotion,
  isLowEnd,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(7.93);
  const currentVideoTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [src]);

  // Scrub video by mapped progress with damping lambda 4
  useEffect(() => {
    if (!isActive || hasError || isLowEnd) return;
    const video = videoRef.current;
    if (!video) return;

    const targetTime = Math.max(0, Math.min(duration, progress * duration));

    if (reducedMotion) {
      video.currentTime = targetTime;
      return;
    }

    let animId: number;
    let lastTime = performance.now();

    const scrubLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const lambda = 4.0;
      const current = currentVideoTimeRef.current;
      const next = current + (targetTime - current) * (1 - Math.exp(-lambda * dt));
      currentVideoTimeRef.current = next;

      // Only seek if difference is meaningful to prevent decoder stall
      if (Math.abs(video.currentTime - next) > 0.015) {
        video.currentTime = next;
      }

      if (Math.abs(targetTime - next) > 0.005) {
        animId = requestAnimationFrame(scrubLoop);
      }
    };

    animId = requestAnimationFrame(scrubLoop);
    return () => cancelAnimationFrame(animId);
  }, [progress, duration, isActive, hasError, reducedMotion, isLowEnd]);

  if (hasError || isLowEnd) {
    return (
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none"
        style={{ opacity }}
      >
        <Image
          src={poster}
          alt="Verity Frame Co."
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-contain"
        />
        {/* Darkening layer for text contrast (30 to 50%) */}
        <div className="absolute inset-0 bg-[#14100E]/40" />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 w-full h-full transition-opacity duration-200 pointer-events-none overflow-hidden"
      style={{ opacity }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
      />
      {/* 30-50% darkening tone in the overlay area so contrast holds */}
      <div className="absolute inset-0 bg-[#14100E]/40" />
    </div>
  );
};
