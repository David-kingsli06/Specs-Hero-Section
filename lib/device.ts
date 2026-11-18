import { DeviceCapabilities } from '@/types/hero';

export function getDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      isLowEnd: false,
      prefersReducedMotion: false,
      isMobile: false,
      dpr: [1, 2],
    };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  // Check hardware concurrency
  const concurrency = navigator.hardwareConcurrency || 4;
  
  // Heuristic GPU check
  let isLowTierGPU = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        if (
          renderer.includes('intel') &&
          !renderer.includes('iris') &&
          !renderer.includes('arc')
        ) {
          isLowTierGPU = true;
        }
      }
    }
  } catch {
    // ignore
  }

  const isLowEnd = concurrency < 4 || isLowTierGPU;
  const dpr: [number, number] = isLowEnd ? [1, 1.25] : [1, 2];

  return {
    isLowEnd,
    prefersReducedMotion,
    isMobile,
    dpr,
  };
}
