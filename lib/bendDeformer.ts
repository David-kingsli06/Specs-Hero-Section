import * as THREE from 'three';

export interface DeformableGeometryData {
  geometry: THREE.BufferGeometry;
  basePositions: Float32Array;
  halfWidth: number;
}

/**
 * Initializes and stores the original rest vertex positions of a geometry.
 */
export function initDeformableGeometry(geometry: THREE.BufferGeometry, halfWidth = 7.0): DeformableGeometryData {
  const positionAttr = geometry.getAttribute('position');
  const basePositions = new Float32Array(positionAttr.array);
  return {
    geometry,
    basePositions,
    halfWidth,
  };
}

/**
 * Applies a cosine falloff bend along the front frame.
 * Moves vertices forward on Z by up to displacement units with a cosine falloff
 * centered at x=0 (the bridge) and reaching 0 at each outer edge (|x| >= halfWidth).
 *
 * displacement: 0 to 0.6 units
 */
export function applyCosineBend(
  data: DeformableGeometryData,
  displacement: number
): void {
  const { geometry, basePositions, halfWidth } = data;
  const positionAttr = geometry.getAttribute('position');
  const posArray = positionAttr.array as Float32Array;
  const count = positionAttr.count;

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = basePositions[idx];
    const y = basePositions[idx + 1];
    const z = basePositions[idx + 2];

    const absX = Math.abs(x);
    if (absX < halfWidth) {
      // normalized distance 0 to 1
      const norm = absX / halfWidth;
      // Cosine falloff: 1 at bridge (norm = 0), 0 at outer lens rim (norm = 1)
      const factor = 0.5 * (1 + Math.cos(norm * Math.PI));
      posArray[idx] = x;
      posArray[idx + 1] = y;
      posArray[idx + 2] = z + displacement * factor;
    } else {
      posArray[idx] = x;
      posArray[idx + 1] = y;
      posArray[idx + 2] = z;
    }
  }

  positionAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}
