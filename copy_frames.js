const fs = require('fs');
const path = require('path');

const framesDir = path.join(process.cwd(), 'public', 'frames');
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Stage 1: frames 0 to 94 (from temp_extract/stage1, 190 frames available)
for (let i = 0; i <= 94; i++) {
  const srcIdx = Math.min(190, Math.max(1, Math.round(1 + i * (189 / 94))));
  const src = path.join(process.cwd(), 'temp_extract', 'stage1', `f_${String(srcIdx).padStart(4, '0')}.jpg`);
  const dest = path.join(framesDir, `frame_${String(i).padStart(3, '0')}.jpg`);
  fs.copyFileSync(src, dest);
}

// Stage 2: frames 95 to 189 (from temp_extract/stage2, 190 frames available)
for (let i = 95; i <= 189; i++) {
  const localIdx = i - 95;
  const srcIdx = Math.min(190, Math.max(1, Math.round(1 + localIdx * (189 / 94))));
  const src = path.join(process.cwd(), 'temp_extract', 'stage2', `f_${String(srcIdx).padStart(4, '0')}.jpg`);
  const dest = path.join(framesDir, `frame_${String(i).padStart(3, '0')}.jpg`);
  fs.copyFileSync(src, dest);
}

// Stage 3: frames 190 to 284 (from temp_extract/stage3, 190 frames available)
for (let i = 190; i <= 284; i++) {
  const localIdx = i - 190;
  const srcIdx = Math.min(190, Math.max(1, Math.round(1 + localIdx * (140 / 94))));
  const src = path.join(process.cwd(), 'temp_extract', 'stage3', `f_${String(srcIdx).padStart(4, '0')}.jpg`);
  const dest = path.join(framesDir, `frame_${String(i).padStart(3, '0')}.jpg`);
  fs.copyFileSync(src, dest);
}

// Stage 4: frames 285 to 379 (from temp_extract/stage3, frames 141 to 190)
for (let i = 285; i <= 379; i++) {
  const localIdx = i - 285;
  const srcIdx = Math.min(190, Math.max(140, Math.round(140 + localIdx * (50 / 94))));
  const src = path.join(process.cwd(), 'temp_extract', 'stage3', `f_${String(srcIdx).padStart(4, '0')}.jpg`);
  const dest = path.join(framesDir, `frame_${String(i).padStart(3, '0')}.jpg`);
  fs.copyFileSync(src, dest);
}

// Create poster /public/verity_poster_16x9.jpg from frame_379.jpg
const posterPath = path.join(process.cwd(), 'public', 'verity_poster_16x9.jpg');
fs.copyFileSync(path.join(framesDir, 'frame_379.jpg'), posterPath);

console.log('Successfully created 380 frames and poster!');
