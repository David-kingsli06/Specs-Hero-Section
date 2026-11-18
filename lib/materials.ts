import * as THREE from 'three';

// Generate procedural subtle acetate grain normal texture
export function createAcetateNormalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(256, 256);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Subtle organic perlin-like / directional grain
    const nx = 128 + Math.floor((Math.random() - 0.5) * 30);
    const ny = 128 + Math.floor((Math.random() - 0.5) * 30);
    const nz = 255;
    data[i] = nx;
    data[i + 1] = ny;
    data[i + 2] = nz;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Generate gradient roughness map along length (0.26 to 0.38)
export function createRoughnessGradientTexture(minRoughness = 0.26, maxRoughness = 0.38): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  const c1 = Math.round(minRoughness * 255);
  const c2 = Math.round(maxRoughness * 255);
  gradient.addColorStop(0, `rgb(${c1},${c1},${c1})`);
  gradient.addColorStop(0.5, `rgb(${c2},${c2},${c2})`);
  gradient.addColorStop(1, `rgb(${c1},${c1},${c1})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Add subtle high-frequency variation
  const imgData = ctx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
    imgData.data[i + 1] = imgData.data[i];
    imgData.data[i + 2] = imgData.data[i];
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createMaterials(isLowEnd = false) {
  const acetateNormal = createAcetateNormalTexture();
  const frameRoughness = createRoughnessGradientTexture(0.26, 0.38);
  const hingeRoughness = createRoughnessGradientTexture(0.24, 0.36);
  const floorRoughness = createRoughnessGradientTexture(0.45, 0.65);

  // Frame and Temples Material: MeshPhysicalMaterial
  // color #E8E2D6, roughness 0.32 with roughness map 0.26-0.38, clearcoat 0.8, clearcoatRoughness 0.12, specularIntensity 0.6
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#E8E2D6'),
    roughness: 0.32,
    roughnessMap: frameRoughness,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
    specularIntensity: 0.6,
    normalMap: acetateNormal,
    normalScale: new THREE.Vector2(0.15, 0.15),
    side: THREE.FrontSide,
  });

  // Lenses Material:
  // Color #8A7F70, transmission 0.9, thickness 0.2, ior 1.5, roughness 0.02, attenuationColor #2B2620, attenuationDistance 0.5, clearcoat 1.0, clearcoatRoughness 0.02, envMapIntensity 1.4
  // On low end: disable transmission and use MeshPhysicalMaterial with opacity 0.85
  const lensMaterial = isLowEnd
    ? new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#8A7F70'),
        roughness: 0.02,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        opacity: 0.85,
        transparent: true,
        envMapIntensity: 1.4,
        side: THREE.FrontSide,
      })
    : new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#8A7F70'),
        transmission: 0.9,
        thickness: 0.2,
        ior: 1.5,
        roughness: 0.02,
        attenuationColor: new THREE.Color('#2B2620'),
        attenuationDistance: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.4,
        transparent: true,
        side: THREE.FrontSide,
      });

  // Hinges and Screws: MeshStandardMaterial, color #B8B4AC, metalness 1.0, roughness 0.3 with roughness map 0.24 to 0.36
  const hingeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#B8B4AC'),
    metalness: 1.0,
    roughness: 0.3,
    roughnessMap: hingeRoughness,
    side: THREE.FrontSide,
  });

  // Floor: MeshStandardMaterial, color #1C1714, roughness 0.55 with roughness map 0.45 to 0.65, metalness 0
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1C1714'),
    roughness: 0.55,
    roughnessMap: floorRoughness,
    metalness: 0.0,
    side: THREE.FrontSide,
  });

  return {
    frameMaterial,
    lensMaterial,
    hingeMaterial,
    floorMaterial,
  };
}
