const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const framesDir = path.join(process.cwd(), 'public', 'frames');

console.log('Converting 192 frames (0 to 191) to WebP format...');

// We have 380 jpg frames (0 to 379). We need 192 webp frames (0 to 191).
// Mapping 192 frames evenly from the 380 frames:
// frame_000.webp -> frame_000.jpg, frame_191.webp -> frame_379.jpg
for (let i = 0; i <= 191; i++) {
  const srcIdx = Math.min(379, Math.round(i * (379 / 191)));
  const srcJpg = path.join(framesDir, `frame_${String(srcIdx).padStart(3, '0')}.jpg`);
  const destWebp = path.join(framesDir, `frame_${String(i).padStart(3, '0')}.webp`);

  // Use ffmpeg to convert to webp quality 85
  const cmd = `ffmpeg -y -i "${srcJpg}" -c:v libwebp -quality 85 "${destWebp}"`;
  execSync(cmd, { stdio: 'ignore' });

  if (i % 25 === 0 || i === 191) {
    console.log(`Generated frame_${String(i).padStart(3, '0')}.webp (from jpg index ${srcIdx})`);
  }
}

console.log('Conversion complete!');
