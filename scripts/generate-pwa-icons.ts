/**
 * Genera todos los íconos PWA a partir de public/logo.png
 *   - icon-192.png, icon-256.png, icon-384.png, icon-512.png   (any purpose)
 *   - maskable-512.png                                          (maskable, con safe area)
 *   - apple-touch-icon.png  (180x180)
 *   - favicon.ico  (32x32 PNG renombrado, suficiente para Next)
 *
 * Uso:  pnpm icons:generate
 */
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'logo.png');
const OUT = path.join(ROOT, 'public', 'icons');

const BRAND_BG = { r: 255, g: 255, b: 255, alpha: 1 }; // fondo blanco para íconos "any"
const MASKABLE_BG = { r: 255, g: 255, b: 255, alpha: 1 }; // blanco también para maskable (logo Azur ya tiene su rojo)

async function generate() {
  await mkdir(OUT, { recursive: true });

  const sizes = [192, 256, 384, 512];

  for (const size of sizes) {
    // Padding ~18% del tamaño para que el logo respire dentro del cuadrado
    const innerSize = Math.round(size * 0.78);
    const padding = Math.round((size - innerSize) / 2);

    const resized = await sharp(SRC)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: BRAND_BG },
    })
      .composite([{ input: resized, top: padding, left: padding }])
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));

    console.log(`✓ icon-${size}.png`);
  }

  // Maskable 512: fondo rojo Azur, logo centrado al ~60% para cumplir safe-zone PWA
  {
    const maskSize = 512;
    const inner = Math.round(maskSize * 0.6);
    const padding = Math.round((maskSize - inner) / 2);
    const resized = await sharp(SRC)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: maskSize, height: maskSize, channels: 4, background: MASKABLE_BG },
    })
      .composite([{ input: resized, top: padding, left: padding }])
      .png()
      .toFile(path.join(OUT, 'maskable-512.png'));

    console.log('✓ maskable-512.png');
  }

  // Apple touch icon 180x180, fondo blanco
  {
    const size = 180;
    const inner = Math.round(size * 0.78);
    const padding = Math.round((size - inner) / 2);
    const resized = await sharp(SRC)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: BRAND_BG },
    })
      .composite([{ input: resized, top: padding, left: padding }])
      .png()
      .toFile(path.join(OUT, 'apple-touch-icon.png'));

    console.log('✓ apple-touch-icon.png');
  }

  // Favicon 32x32 PNG (Next acepta favicon.ico o icon.png en /app — usamos /app/icon.png)
  {
    const size = 64;
    const inner = Math.round(size * 0.86);
    const padding = Math.round((size - inner) / 2);
    const resized = await sharp(SRC)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: resized, top: padding, left: padding }])
      .png()
      .toFile(path.join(ROOT, 'app', 'icon.png'));

    console.log('✓ app/icon.png');
  }

  console.log('\nÍconos generados en:', OUT);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
