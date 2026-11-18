'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ProceduralGlasses } from './ProceduralGlasses';
import { createMaterials } from '@/lib/materials';
import { initDeformableGeometry, applyCosineBend, DeformableGeometryData } from '@/lib/bendDeformer';

interface GlassesProps {
  progress: number; // 0 to 1 overall hero scroll
  isStationary: boolean;
  reducedMotion: boolean;
  isLowEnd: boolean;
}

export const Glasses: React.FC<GlassesProps> = ({
  progress,
  isStationary,
  reducedMotion,
  isLowEnd,
}) => {
  const rootRef = useRef<THREE.Group | null>(null);
  const [hasGLB, setHasGLB] = useState<boolean | null>(null);

  // Material instances
  const materials = React.useMemo(() => createMaterials(isLowEnd), [isLowEnd]);

  // Check if /models/sunglasses.glb exists via a single HEAD request
  useEffect(() => {
    fetch('/models/sunglasses.glb', { method: 'HEAD' })
      .then((res) => {
        setHasGLB(res.ok && res.status !== 404);
      })
      .catch(() => {
        setHasGLB(false);
      });
  }, []);

  // Geometry deformer state
  const deformerRef = useRef<{
    frame?: DeformableGeometryData;
    leftLens?: DeformableGeometryData;
    rightLens?: DeformableGeometryData;
  }>({});

  const handleGeometriesReady = React.useCallback(
    (data: {
      frameGeo: THREE.BufferGeometry;
      leftLensGeo: THREE.BufferGeometry;
      rightLensGeo: THREE.BufferGeometry;
    }) => {
      deformerRef.current = {
        frame: initDeformableGeometry(data.frameGeo, 7.0),
        leftLens: initDeformableGeometry(data.leftLensGeo, 3.0),
        rightLens: initDeformableGeometry(data.rightLensGeo, 3.0),
      };
    },
    []
  );

  // Dynamic temple angles and animated values
  const [templeAngle, setTempleAngle] = useState(0);

  // Spring state for temple overshoot: stiffness 180, damping 18
  const springPosRef = useRef(0);
  const springVelRef = useRef(0);

  // Time accumulator for idle motion
  const idleTimeRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    if (!rootRef.current) return;

    // Stage 3 progress: p from 0.66 to 1.0
    // Stage 3 starts at Y rotation 90 degrees (Math.PI / 2) with closed temples
    // Flex test: temples open 0 to 28 degrees (0.488 rad) and close back to 0 degrees
    // front bow flexes forward 0 to 0.6 units with cosine falloff
    // frame settles to 0 degrees on Y with a 1.5-degree overshoot on temples
    const stage3Raw = Math.max(0, Math.min(1, (progress - 0.66) / 0.34));

    if (reducedMotion) {
      rootRef.current.rotation.y = (1 - stage3Raw) * (Math.PI / 2);
      rootRef.current.position.y = 0;
      setTempleAngle(0);
      if (deformerRef.current.frame) {
        applyCosineBend(deformerRef.current.frame, 0);
      }
      return;
    }

    // 1. Y Rotation: power2.inOut from Math.PI / 2 (90 deg) to 0 deg
    // power2.inOut curve
    const easeInOutQuad = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const rotYProgress = easeInOutQuad(stage3Raw);
    let targetRotY = (1 - rotYProgress) * (Math.PI / 2);

    // 2. Front bow displacement: sine.inOut between 0 and 0.6 units
    // Reaches peak flex midway through stage 3 (around stage3Raw = 0.5), returning to 0 at stage3Raw = 1
    const flexProgress = Math.sin(stage3Raw * Math.PI);
    const displacement = flexProgress * 0.6;

    if (deformerRef.current.frame) {
      applyCosineBend(deformerRef.current.frame, displacement);
    }
    if (deformerRef.current.leftLens) {
      applyCosineBend(deformerRef.current.leftLens, displacement * 0.4);
    }
    if (deformerRef.current.rightLens) {
      applyCosineBend(deformerRef.current.rightLens, displacement * 0.4);
    }

    // 3. Temple rotation: open 0 to 28 degrees (0.488 rad) and close back to 0 degrees
    // Temples flex open as front bends
    const maxTempleRad = (28 * Math.PI) / 180;
    let baseTempleAngle = Math.sin(stage3Raw * Math.PI) * maxTempleRad;

    // 4. Temple overshoot spring at the end: stiffness 180, damping 18
    // Applied to the last 1.5 degrees (0.026 rad) settling within 0.6 units
    if (stage3Raw > 0.85) {
      const springTarget = (1.5 * Math.PI) / 180 * Math.sin((stage3Raw - 0.85) * Math.PI * 4) * (1 - stage3Raw) / 0.15;
      const k = 180;
      const c = 18;
      const f = -k * (springPosRef.current - springTarget) - c * springVelRef.current;
      springVelRef.current += f * dt;
      springPosRef.current += springVelRef.current * dt;
      baseTempleAngle += springPosRef.current;
    }

    setTempleAngle(baseTempleAngle);

    // 5. Idle motion when stationary (3D stage only):
    // Y sway of +/- 2 deg on 8s sine cycle, vertical bob +/- 0.05 on 6s cycle
    if (stage3Raw > 0.05) {
      idleTimeRef.current += dt;
      const t = idleTimeRef.current;
      const sway = Math.sin((t * Math.PI * 2) / 8) * ((2 * Math.PI) / 180);
      const bob = Math.sin((t * Math.PI * 2) / 6) * 0.05;

      rootRef.current.rotation.y = targetRotY + sway;
      rootRef.current.position.y = bob;
    } else {
      rootRef.current.rotation.y = targetRotY;
      rootRef.current.position.y = 0;
    }
  });

  return (
    <group ref={rootRef} dispose={null}>
      <ProceduralGlasses
        onGeometriesReady={handleGeometriesReady}
        frameMaterial={materials.frameMaterial}
        lensMaterial={materials.lensMaterial}
        hingeMaterial={materials.hingeMaterial}
        leftTempleAngle={templeAngle}
        rightTempleAngle={templeAngle}
      />
    </group>
  );
};
