export interface StageConfig {
  id: number;
  name: string;
  headline: string;
  subline: string;
  range: [number, number]; // [start, end] from 0 to 1
  videoDesktop?: string;
  videoMobile?: string;
  poster?: string;
}

export interface DeviceCapabilities {
  isLowEnd: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  dpr: [number, number];
}

export interface ScrollHeroState {
  progress: number; // raw progress 0 to 1
  dampedProgress: number; // smoothed progress
  activeStage: number; // 1, 2, or 3
  isStationary: boolean;
}
