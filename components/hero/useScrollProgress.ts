'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface UseScrollProgressResult {
  progress: number;
  dampedProgress: number;
  isStationary: boolean;
}

export function useScrollProgress(containerRef: React.RefObject<HTMLElement | null>, reducedMotion = false): UseScrollProgressResult {
  const [progress, setProgress] = useState(0);
  const [dampedProgress, setDampedProgress] = useState(0);
  const [isStationary, setIsStationary] = useState(true);

  const rawProgressRef = useRef(0);
  const dampedProgressRef = useRef(0);
  const lastRawProgressRef = useRef(0);
  const stationaryTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Create ScrollTrigger pinning 300vh section with sticky 100vh
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;
        rawProgressRef.current = p;
        setProgress(p);

        setIsStationary(false);
        if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current);
        stationaryTimerRef.current = setTimeout(() => {
          setIsStationary(true);
        }, 150);
      },
    });

    return () => {
      trigger.kill();
      if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current);
    };
  }, [containerRef]);

  // Animation frame loop for dampening with lambda 4
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const target = rawProgressRef.current;
      if (reducedMotion) {
        dampedProgressRef.current = target;
        setDampedProgress(target);
      } else {
        // Exponential damping: val = damp(current, target, lambda, dt)
        // val += (target - current) * (1 - exp(-lambda * dt))
        const lambda = 4.0;
        const current = dampedProgressRef.current;
        const next = current + (target - current) * (1 - Math.exp(-lambda * dt));
        dampedProgressRef.current = next;
        setDampedProgress(next);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [reducedMotion]);

  return {
    progress,
    dampedProgress,
    isStationary,
  };
}
