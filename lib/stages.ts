import { StageConfig } from '@/types/hero';

export const BRAND = {
  name: 'Verity Frame Co.',
  tagline: 'Built to last for years.',
  colors: {
    boneWhite: '#E8E2D6',
    warmCharcoal: '#14100E',
    darkFloor: '#1C1714',
    steelHinge: '#B8B4AC',
    lensTint: '#8A7F70',
    lensAttenuation: '#2B2620',
    keyLight: '#FFF4E6',
    rimLight: '#FFC79A',
    skyLight: '#F2EAE0',
    textMain: '#F3EDE3',
  },
};

export const STAGES: StageConfig[] = [
  {
    id: 1,
    name: 'flex',
    headline: 'Made to flex.',
    subline: 'Acetate and steel, built to bend.',
    range: [0, 0.33],
    videoDesktop: '/videos/hand-flex-desktop.mp4',
    videoMobile: '/videos/hand-flex-mobile.mp4',
    poster: '/videos/hand-flex-poster.jpg',
  },
  {
    id: 2,
    name: 'rotation',
    headline: 'Every side, built true.',
    subline: 'Tested from every angle.',
    range: [0.33, 0.66],
    videoDesktop: '/videos/rotation-desktop.mp4',
    videoMobile: '/videos/rotation-mobile.mp4',
    poster: '/videos/rotation-poster.jpg',
  },
  {
    id: 3,
    name: 'shape',
    headline: 'Back to shape.',
    subline: 'Built to last for years.',
    range: [0.66, 1.0],
  },
];

export const CROSSFADE_DURATION = 0.08; // 0.08 units of scroll
