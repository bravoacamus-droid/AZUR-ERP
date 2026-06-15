// Genera los iconos PWA desde logoazur.png con fondo blanco (spec: logo rojo
// siempre sobre fondo blanco para contraste). uso: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/icons', { recursive: true });
const SRC = 'logoazur.png';
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function icon(size, out, padRatio = 0.16) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(out);
  console.log('wrote', out);
}

await icon(192, 'public/icons/icon-192.png');
await icon(512, 'public/icons/icon-512.png');
await icon(512, 'public/icons/maskable-512.png', 0.22);
await icon(180, 'public/icons/apple-touch-icon.png', 0.12);
await icon(32, 'public/favicon.ico');
// logo a tamaño para UI (sobre blanco)
await icon(256, 'public/logo-mark.png', 0.06);
console.log('done');
