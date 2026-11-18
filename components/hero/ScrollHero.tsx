'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useScrollProgress } from './useScrollProgress';
import { HeroVisual } from './HeroVisual';
import { OverlayText } from './OverlayText';
import { getDeviceCapabilities } from '@/lib/device';
import { DeviceCapabilities } from '@/types/hero';

export const ScrollHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize state with identical defaults on server and client to prevent hydration mismatch
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isLowEnd: false,
    prefersReducedMotion: false,
    isMobile: false,
    dpr: [1, 2],
  });

  // Client-only initialization
  useEffect(() => {
    setCapabilities(getDeviceCapabilities());

    const handleResize = () => {
      setCapabilities((prev) => ({
        ...prev,
        isMobile: window.innerWidth < 768,
      }));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { progress, dampedProgress, isStationary } = useScrollProgress(
    containerRef,
    capabilities.prefersReducedMotion
  );

  return (
    <section
      ref={containerRef}
      aria-label="Verity Frame Co. hero"
      className="relative w-full h-[300vh] bg-[#14100E]"
    >
      {/* Sticky 100vh Viewport */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-[#14100E]">
        {/* Desktop / Tablet / Mobile Responsive Layout:
            Desktop (min-width 1024px): two-column grid. Text 40% left, Visual 60% right.
            Tablet (768px - 1023px): 45/55 split.
            Mobile (max-width 767px): Visual top 58vh, Text bottom 42vh.
        */}
        <div className="w-full h-full flex flex-col md:grid md:grid-cols-[45%_55%] lg:grid-cols-[40%_60%]">
          {/* Text Column */}
          <div className="order-2 md:order-1 h-[42vh] md:h-full flex items-center justify-start px-6 md:px-12 lg:px-16 z-20">
            <OverlayText
              progress={dampedProgress}
              reducedMotion={capabilities.prefersReducedMotion}
            />
          </div>

          {/* Visual Column */}
          <div className="order-1 md:order-2 h-[58vh] md:h-full relative w-full flex items-center justify-center p-0 md:p-[12%] z-10">
            <HeroVisual
              progress={progress}
              dampedProgress={dampedProgress}
              isStationary={isStationary}
              reducedMotion={capabilities.prefersReducedMotion}
              isLowEnd={capabilities.isLowEnd}
              isMobile={capabilities.isMobile}
              dpr={capabilities.dpr}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
