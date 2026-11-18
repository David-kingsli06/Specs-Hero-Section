'use client';

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Glasses } from './Glasses';
import { Lights } from './Lights';

interface SunglassesSceneProps {
  progress: number;
  opacity: number;
  isStationary: boolean;
  reducedMotion: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
  dpr: [number, number];
}

export const SunglassesScene: React.FC<SunglassesSceneProps> = ({
  progress,
  opacity,
  isStationary,
  reducedMotion,
  isLowEnd,
  isMobile,
  dpr,
}) => {
  // Camera calculations:
  // Desktop: PerspectiveCamera, fov 24, position [0, 1.4, 22], looking at [0, 0, 0], fixed. Fits 14-unit front with 12% padding.
  // Mobile: set distance so 14-unit front uses <= 70% of canvas width.
  // At fov 24, half-fov is 12 deg. Tan(12 deg) = 0.21255.
  // For mobile (aspect ~ 9/16 = 0.5625), horizontal FOV is smaller:
  // visible width at distance D = 2 * D * tan(12 deg) * aspect.
  // 14 / (2 * D * 0.21255 * aspect) <= 0.70 => D >= 14 / (1.4 * 0.21255 * 0.5625) ≈ 83.
  const cameraZ = useMemo(() => {
    if (isMobile) return 36; // comfortable framing fitting 70% width
    return 22;
  }, [isMobile]);

  // Bloom intensity: 0.2 base, rises to 0.35 at p = 1
  const bloomIntensity = useMemo(() => {
    if (isLowEnd) return 0;
    const stage3Raw = Math.max(0, Math.min(1, (progress - 0.66) / 0.34));
    return 0.2 + stage3Raw * 0.15;
  }, [progress, isLowEnd]);

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200"
      style={{ opacity }}
    >
      <Canvas
        dpr={dpr}
        gl={{
          antialias: !isLowEnd,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        shadows={!isLowEnd}
      >
        <PerspectiveCamera
          makeDefault
          fov={24}
          position={[0, 1.4, cameraZ]}
        />

        <Suspense fallback={null}>
          {/* Environment: drei Environment preset "studio", environmentIntensity 0.9 */}
          <Environment preset="studio" environmentIntensity={0.9} />

          <Lights progress={progress} isLowEnd={isLowEnd} />

          <Glasses
            progress={progress}
            isStationary={isStationary}
            reducedMotion={reducedMotion}
            isLowEnd={isLowEnd}
          />

          {/* Post-processing: Bloom (0.2 -> 0.35, threshold 0.9, smoothing 0.4) & Vignette (offset 0.3, darkness 0.3). Disabled on low-end */}
          {!isLowEnd && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={0.9}
                luminanceSmoothing={0.4}
              />
              <Vignette offset={0.3} darkness={0.3} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};
