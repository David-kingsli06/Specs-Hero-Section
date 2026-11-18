'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TOTAL_FRAMES, getFramePath, progressToFrameIndex } from '@/lib/frames';

interface FrameCanvasProps {
  progress: number; // raw progress (0 to 1)
  reducedMotion: boolean;
  onFirstFramesDecoded?: () => void;
  onLoadingProgress?: (ratio: number) => void;
}

export const FrameCanvas: React.FC<FrameCanvasProps> = ({
  progress,
  reducedMotion,
  onFirstFramesDecoded,
  onLoadingProgress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const decodedRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));
  const currentDrawnIndexRef = useRef<number>(-1);

  // Smooth lerp state: applied to p only
  const smoothProgressRef = useRef<number>(progress);
  const targetProgressRef = useRef<number>(progress);
  targetProgressRef.current = progress;

  const [canvasVisible, setCanvasVisible] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  // Check device tier
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLowEnd(Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4));
    }
  }, []);

  /**
   * Cover draw with 104% center crop
   */
  const drawCoverImage = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
      const cWidth = canvas.width;
      const cHeight = canvas.height;
      const iWidth = img.naturalWidth;
      const iHeight = img.naturalHeight;

      if (cWidth === 0 || cHeight === 0 || iWidth === 0 || iHeight === 0) return;

      const cropScale = 1.04;
      const baseScale = Math.max(cWidth / iWidth, cHeight / iHeight);
      const renderScale = baseScale * cropScale;

      const renderW = iWidth * renderScale;
      const renderH = iHeight * renderScale;
      const offsetX = (cWidth - renderW) / 2;
      const offsetY = (cHeight - renderH) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, cWidth, cHeight);
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    },
    []
  );

  // Draw frame only when index changes
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imagesRef.current[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) {
        // Fallback to nearest loaded frame
        for (let offset = 1; offset < 40; offset++) {
          const prev = imagesRef.current[frameIndex - offset];
          if (prev && prev.complete && prev.naturalWidth > 0) {
            drawCoverImage(ctx, canvas, prev);
            currentDrawnIndexRef.current = frameIndex - offset;
            return;
          }
          const next = imagesRef.current[frameIndex + offset];
          if (next && next.complete && next.naturalWidth > 0) {
            drawCoverImage(ctx, canvas, next);
            currentDrawnIndexRef.current = frameIndex + offset;
            return;
          }
        }
        return;
      }

      drawCoverImage(ctx, canvas, img);
      currentDrawnIndexRef.current = frameIndex;
    },
    [drawCoverImage]
  );

  // Resize canvas with DPR [1, 2] cap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      const newW = Math.round(rect.width * dpr);
      const newH = Math.round(rect.height * dpr);

      if (canvas.width !== newW || canvas.height !== newH) {
        canvas.width = newW;
        canvas.height = newH;
        if (currentDrawnIndexRef.current >= 0) {
          drawFrame(currentDrawnIndexRef.current);
        } else {
          drawFrame(0);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  // Preload and confirm all 192 webp frames (frame_000.webp to frame_191.webp)
  useEffect(() => {
    let loadedCount = 0;
    const totalToLoad = TOTAL_FRAMES;
    let initialDecodedFired = false;

    const loadFrame = (index: number) => {
      if (imagesRef.current[index]) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const img = new Image();
        const src = getFramePath(index);
        img.src = src;

        const onDone = () => {
          imagesRef.current[index] = img;
          decodedRef.current[index] = true;
          loadedCount++;

          if (onLoadingProgress) {
            onLoadingProgress(loadedCount / totalToLoad);
          }

          if (!initialDecodedFired && (loadedCount >= 5 || index === 0)) {
            initialDecodedFired = true;
            setCanvasVisible(true);
            drawFrame(0);
            if (onFirstFramesDecoded) onFirstFramesDecoded();
          }

          // If current viewing index matches, draw immediately
          const currentTargetIndex = progressToFrameIndex(smoothProgressRef.current, isLowEnd);
          if (index === currentTargetIndex) {
            drawFrame(index);
          }

          resolve();
        };

        const onError = () => {
          console.error(`[FrameCanvas] Failed to load frame: ${src}`);
          resolve();
        };

        if ('decode' in img) {
          (img as HTMLImageElement).decode().then(onDone).catch(onDone);
        } else {
          (img as HTMLImageElement).onload = onDone;
          (img as HTMLImageElement).onerror = onError;
        }
      });
    };

    // Priority 1: Load first 20 frames immediately
    const loadAll = async () => {
      const firstBatch = [];
      for (let i = 0; i < Math.min(20, TOTAL_FRAMES); i++) {
        firstBatch.push(loadFrame(i));
      }
      await Promise.all(firstBatch);

      // Priority 2: Preload remaining frames in batches of 12
      let idx = 20;
      const loadNext = () => {
        if (idx >= TOTAL_FRAMES) return;
        const batch = [];
        for (let b = 0; b < 12 && idx < TOTAL_FRAMES; b++, idx++) {
          batch.push(loadFrame(idx));
        }
        Promise.all(batch).then(() => {
          setTimeout(loadNext, 4);
        });
      };
      loadNext();
    };

    loadAll();
  }, [onFirstFramesDecoded, onLoadingProgress, drawFrame, isLowEnd]);

  // Animation frame loop:
  // Apply 0.06 lerp to p only. Then compute target index = round(p * 191).
  // Redraw ONLY when index changes.
  useEffect(() => {
    if (reducedMotion) return;

    let animId: number;

    const renderLoop = () => {
      const targetP = targetProgressRef.current;
      const currentP = smoothProgressRef.current;
      const lerpFactor = 0.06;

      // 1. Lerp applied to p only
      const nextP = currentP + (targetP - currentP) * lerpFactor;
      smoothProgressRef.current = nextP;

      // 2. Compute target index as round(p * 191)
      const targetIndex = progressToFrameIndex(nextP, isLowEnd);

      // 3. Log current p and index in console during development
      if (process.env.NODE_ENV === 'development') {
        if (Math.abs(targetP - currentP) > 0.0005) {
          console.log(`[FrameScrub] p: ${nextP.toFixed(4)} | index: ${targetIndex} / 191`);
        }
      }

      // 4. Redraw ONLY when index changes
      if (targetIndex !== currentDrawnIndexRef.current) {
        drawFrame(targetIndex);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [reducedMotion, isLowEnd, drawFrame]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Verity Frame Co. sunglasses, shown flexing in hand, turning to show every side, and settling in their final form as you scroll."
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-600 ease-out pointer-events-none ${
        canvasVisible ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};
