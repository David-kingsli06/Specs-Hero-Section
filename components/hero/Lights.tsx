'use client';

import React from 'react';
import { ContactShadows } from '@react-three/drei';

interface LightsProps {
  progress: number; // 0 to 1
  isLowEnd: boolean;
}

export const Lights: React.FC<LightsProps> = ({ progress, isLowEnd }) => {
  // Stage 3 bend progress (p from 0.66 to 1.0)
  const stage3Raw = Math.max(0, Math.min(1, (progress - 0.66) / 0.34));
  // Bend peak reaches midway
  const bendProgress = Math.sin(stage3Raw * Math.PI);
  // Rim light: 3.0, raises to 4.5 during Stage 3's bend so bridge catches light
  const rimIntensity = 3.0 + bendProgress * 1.5;

  return (
    <>
      {/* Key light: DirectionalLight at [3, 5, 5], intensity 2.4, color #FFF4E6, shadow map 1024 (or 512 on low-end), bias -0.0004 */}
      <directionalLight
        position={[3, 5, 5]}
        intensity={2.4}
        color="#FFF4E6"
        castShadow={!isLowEnd}
        shadow-mapSize-width={isLowEnd ? 512 : 1024}
        shadow-mapSize-height={isLowEnd ? 512 : 1024}
        shadow-bias={-0.0004}
      />

      {/* Rim light: SpotLight at [-4, 3, -5], angle 0.5, penumbra 0.6, intensity 3.0 -> 4.5, color #FFC79A */}
      <spotLight
        position={[-4, 3, -5]}
        angle={0.5}
        penumbra={0.6}
        intensity={rimIntensity}
        color="#FFC79A"
      />

      {/* Fill light: HemisphereLight, sky #F2EAE0, ground #14100E, intensity 0.45 */}
      <hemisphereLight
        args={['#F2EAE0', '#14100E', 0.45]}
        position={[0, 10, 0]}
      />

      {/* Contact shadow: drei ContactShadows at y = -2.6, opacity 0.5, scale 18, blur 2.2, far 4, resolution 512 */}
      <ContactShadows
        position={[0, -2.6, 0]}
        opacity={0.5}
        scale={18}
        blur={2.2}
        far={4}
        resolution={isLowEnd ? 256 : 512}
        color="#0A0807"
      />
    </>
  );
};
