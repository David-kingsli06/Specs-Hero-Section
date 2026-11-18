export const TOTAL_FRAMES = 192; // 0 to 191

export interface StageBoundary {
  stage: number;
  targetP: number;
  startFrame: number;
  endFrame: number;
  name: string;
}

export const STAGES: StageBoundary[] = [
  {
    stage: 1,
    targetP: 0.0,
    startFrame: 0,
    endFrame: 47,
    name: 'Made to flex.',
  },
  {
    stage: 2,
    targetP: 0.3333,
    startFrame: 48,
    endFrame: 95,
    name: 'Built true from every side.',
  },
  {
    stage: 3,
    targetP: 0.6666,
    startFrame: 96,
    endFrame: 143,
    name: 'Back to shape.',
  },
  {
    stage: 4,
    targetP: 1.0,
    startFrame: 144,
    endFrame: 191,
    name: 'Verity Frame Co.',
  },
];

/**
 * Maps progress p (0 to 1) directly to target integer frame index (0 to 191).
 * Round(p * 191).
 */
export function progressToFrameIndex(p: number, isLowEnd = false): number {
  const clamped = Math.max(0, Math.min(1, p));
  let index = Math.round(clamped * 191);
  if (isLowEnd) {
    index = Math.round(index / 2) * 2;
  }
  return Math.min(191, Math.max(0, index));
}

/**
 * Returns active stage (1 to 4) based on progress p
 */
export function getActiveStage(p: number): number {
  if (p < 0.20) return 1;
  if (p < 0.50) return 2;
  if (p < 0.80) return 3;
  return 4;
}

/**
 * Path to .webp frame
 */
export function getFramePath(index: number): string {
  const padded = String(index).padStart(3, '0');
  return `/frames/frame_${padded}.webp`;
}
