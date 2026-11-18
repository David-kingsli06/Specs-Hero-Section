'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ProceduralFrameProps {
  onGeometriesReady?: (data: {
    frameGeo: THREE.BufferGeometry;
    leftLensGeo: THREE.BufferGeometry;
    rightLensGeo: THREE.BufferGeometry;
  }) => void;
  frameMaterial: THREE.Material;
  lensMaterial: THREE.Material;
  hingeMaterial: THREE.Material;
  leftTempleAngle: number;
  rightTempleAngle: number;
}

/**
 * Creates a rounded rectangle 2D shape with width w, height h, and corner radius r.
 */
function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/**
 * Procedural sunglasses built to exact proportions:
 * 1 unit = 1 cm
 * Overall front width: 14.0.
 * Lens width: 5.2, Lens height: 4.2, corner radius: 1.0.
 * Bridge width: 1.9. Front height ~4.6.
 * Rim extrusions: 0.45 tall, 0.35 deep, 0.12 bevel, 6 bevel segments.
 * Temples: 14.5 long, 0.3 deep, 0.6 tall, 0.2 bevel, curving down 1.8 over last 3 units.
 * Hinges: cylinders radius 0.22, height 0.6. Screws: radius 0.12, length 0.25.
 * Lenses: curved discs 0.2 thick, curved 2 deg outward.
 */
export const ProceduralGlasses: React.FC<ProceduralFrameProps> = ({
  onGeometriesReady,
  frameMaterial,
  lensMaterial,
  hingeMaterial,
  leftTempleAngle,
  rightTempleAngle,
}) => {
  // Build geometries once
  const { frameGeo, leftLensGeo, rightLensGeo, leftTempleGeo, rightTempleGeo, hingeGeo, screwGeo } =
    useMemo(() => {
      // 1. Lens Shape & Rim Hole
      const lensW = 5.2;
      const lensH = 4.2;
      const lensR = 0.95;
      const rimBorder = 0.42;

      // Outer rim shape
      const outerW = lensW + rimBorder * 2;
      const outerH = lensH + rimBorder * 2;
      const outerR = lensR + rimBorder * 0.5;

      const outerShape = createRoundedRectShape(outerW, outerH, outerR);
      const holeShape = createRoundedRectShape(lensW, lensH, lensR);
      outerShape.holes.push(holeShape);

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.35,
        bevelEnabled: true,
        bevelSegments: 6,
        steps: 1,
        bevelSize: 0.12,
        bevelThickness: 0.12,
        curveSegments: 24,
      };

      const leftRimGeo = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      const rightRimGeo = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);

      // Center of lenses: bridge width is 1.9, so distance between rim inner edges is 1.9
      // Lens center distance = outerW/2 - rimBorder + 1.9/2 + lensW/2 = 1.9/2 + lensW/2 = 0.95 + 2.6 = 3.55
      const lensCenterOffset = 3.55;

      leftRimGeo.translate(-lensCenterOffset, 0, -0.175);
      rightRimGeo.translate(lensCenterOffset, 0, -0.175);

      // Bridge geometry connecting the rims
      const bridgeShape = createRoundedRectShape(2.1, 0.45, 0.15);
      const bridgeGeo = new THREE.ExtrudeGeometry(bridgeShape, {
        depth: 0.3,
        bevelEnabled: true,
        bevelSegments: 6,
        bevelSize: 0.08,
        bevelThickness: 0.08,
      });
      bridgeGeo.translate(0, 0.4, -0.15);

      // Merge into a single continuous front frame geometry
      // Using manual attribute merging for compatibility and speed
      const geos = [leftRimGeo, rightRimGeo, bridgeGeo];
      let totalPos = 0;
      let totalNorm = 0;
      let totalIdx = 0;
      geos.forEach((g) => {
        totalPos += g.attributes.position.count * 3;
        totalNorm += g.attributes.normal.count * 3;
        if (g.index) totalIdx += g.index.count;
      });

      const mergedPos = new Float32Array(totalPos);
      const mergedNorm = new Float32Array(totalNorm);
      const mergedIdx = new Uint32Array(totalIdx);

      let posOffset = 0;
      let normOffset = 0;
      let idxOffset = 0;
      let vertexOffset = 0;

      geos.forEach((g) => {
        mergedPos.set(g.attributes.position.array, posOffset);
        mergedNorm.set(g.attributes.normal.array, normOffset);
        if (g.index) {
          for (let i = 0; i < g.index.count; i++) {
            mergedIdx[idxOffset + i] = g.index.array[i] + vertexOffset;
          }
          idxOffset += g.index.count;
        }
        posOffset += g.attributes.position.array.length;
        normOffset += g.attributes.normal.array.length;
        vertexOffset += g.attributes.position.count;
      });

      const mergedFrameGeo = new THREE.BufferGeometry();
      mergedFrameGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
      mergedFrameGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
      mergedFrameGeo.setIndex(new THREE.BufferAttribute(mergedIdx, 1));

      // 2. Lenses (slightly curved solid discs 0.2 thick)
      const lensSolidShape = createRoundedRectShape(lensW + 0.05, lensH + 0.05, lensR);
      const lensExtrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.2,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.05,
        bevelThickness: 0.05,
        curveSegments: 24,
      };

      const lLens = new THREE.ExtrudeGeometry(lensSolidShape, lensExtrudeSettings);
      const rLens = new THREE.ExtrudeGeometry(lensSolidShape, lensExtrudeSettings);

      // Apply 2 degree curvature outward
      const bendLens = (geo: THREE.BufferGeometry) => {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const lx = pos.getX(i);
          const ly = pos.getY(i);
          const lz = pos.getZ(i);
          // slight spherical outward curve
          const r2 = (lx * lx) / (lensW * lensW) + (ly * ly) / (lensH * lensH);
          const curvatureZ = Math.cos(r2 * (Math.PI / 8)) * 0.12;
          pos.setZ(i, lz + curvatureZ - 0.1);
        }
        geo.computeVertexNormals();
      };

      bendLens(lLens);
      bendLens(rLens);

      lLens.translate(-lensCenterOffset, 0, 0);
      rLens.translate(lensCenterOffset, 0, 0);

      // 3. Temples (14.5 long, 0.3 deep, 0.6 tall, curved down 1.8 over last 3 units)
      const createTempleGeometry = (isLeft: boolean) => {
        // Spline path for extrusion to give the ergonomic ear curve
        const path = new THREE.CurvePath<THREE.Vector3>();
        const p0 = new THREE.Vector3(0, 0, 0);
        const p1 = new THREE.Vector3(0, 0, -11.5);
        const p2 = new THREE.Vector3(0, -0.6, -13.2);
        const p3 = new THREE.Vector3(isLeft ? 0.3 : -0.3, -1.8, -14.5);

        const curve1 = new THREE.LineCurve3(p0, p1);
        const curve2 = new THREE.CubicBezierCurve3(p1, new THREE.Vector3(0, -0.2, -12.3), p2, p3);
        path.add(curve1);
        path.add(curve2);

        // Rectangular cross-section with rounded edges
        const armCrossSection = createRoundedRectShape(0.3, 0.6, 0.08);

        const templeGeom = new THREE.ExtrudeGeometry(armCrossSection, {
          extrudePath: path,
          steps: 40,
          bevelEnabled: true,
          bevelSegments: 4,
          bevelSize: 0.04,
          bevelThickness: 0.04,
        });

        return templeGeom;
      };

      const lTemple = createTempleGeometry(true);
      const rTemple = createTempleGeometry(false);

      // 4. Hinges & Screws
      // cylinders radius 0.22, height 0.6. Screws: radius 0.12, length 0.25
      const hGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.6, 24);
      const sGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);

      return {
        frameGeo: mergedFrameGeo,
        leftLensGeo: lLens,
        rightLensGeo: rLens,
        leftTempleGeo: lTemple,
        rightTempleGeo: rTemple,
        hingeGeo: hGeo,
        screwGeo: sGeo,
      };
    }, []);

  // Pass geometries up to parent for deformable vertex control
  React.useEffect(() => {
    if (onGeometriesReady) {
      onGeometriesReady({
        frameGeo,
        leftLensGeo,
        rightLensGeo,
      });
    }
  }, [frameGeo, leftLensGeo, rightLensGeo, onGeometriesReady]);

  const templeHingeX = 6.6;
  const templeHingeY = 0.4;
  const templeHingeZ = -0.2;

  return (
    <group>
      {/* Front Frame with extruded bevel */}
      <mesh geometry={frameGeo} material={frameMaterial} castShadow receiveShadow />

      {/* Lenses */}
      <mesh geometry={leftLensGeo} material={lensMaterial} castShadow receiveShadow />
      <mesh geometry={rightLensGeo} material={lensMaterial} castShadow receiveShadow />

      {/* Left Hinge & Temple assembly */}
      <group position={[-templeHingeX, templeHingeY, templeHingeZ]}>
        <mesh geometry={hingeGeo} material={hingeMaterial} castShadow receiveShadow />
        <mesh
          geometry={screwGeo}
          material={hingeMaterial}
          position={[0, 0.32, 0]}
          rotation={[0, 0, 0]}
          castShadow
        />
        <mesh
          geometry={screwGeo}
          material={hingeMaterial}
          position={[0, -0.32, 0]}
          rotation={[0, 0, 0]}
          castShadow
        />
        {/* Left Temple rotatable around hinge Y axis */}
        <group rotation={[0, leftTempleAngle, 0]}>
          <mesh
            geometry={leftTempleGeo}
            material={frameMaterial}
            position={[0, 0, 0]}
            castShadow
            receiveShadow
          />
        </group>
      </group>

      {/* Right Hinge & Temple assembly */}
      <group position={[templeHingeX, templeHingeY, templeHingeZ]}>
        <mesh geometry={hingeGeo} material={hingeMaterial} castShadow receiveShadow />
        <mesh
          geometry={screwGeo}
          material={hingeMaterial}
          position={[0, 0.32, 0]}
          rotation={[0, 0, 0]}
          castShadow
        />
        <mesh
          geometry={screwGeo}
          material={hingeMaterial}
          position={[0, -0.32, 0]}
          rotation={[0, 0, 0]}
          castShadow
        />
        {/* Right Temple rotatable around hinge Y axis */}
        <group rotation={[0, -rightTempleAngle, 0]}>
          <mesh
            geometry={rightTempleGeo}
            material={frameMaterial}
            position={[0, 0, 0]}
            castShadow
            receiveShadow
          />
        </group>
      </group>
    </group>
  );
};
