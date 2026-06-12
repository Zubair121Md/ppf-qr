const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.35}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FS', size / 2, size / 2);

  const outPath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`Created ${filename}`);
}

try {
  generateIcon(192, 'icon-192.png');
  generateIcon(512, 'icon-512.png');
} catch {
  console.log('canvas not available — create icon-192.png and icon-512.png manually');
}
