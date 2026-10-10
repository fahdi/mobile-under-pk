import sharp from 'sharp';

export const PHOTO_WIDTH = 600;
export const PHOTO_HEIGHT = 800;

// Normalise an official press photo: trim the uniform studio background,
// fit the phone into a fixed transparent canvas without cropping, encode WebP.
export async function processPhoto(input: Buffer): Promise<Buffer> {
  const trimmed = await sharp(input).trim({ threshold: 20 }).toBuffer();
  return sharp(trimmed)
    .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80, alphaQuality: 90, effort: 5 })
    .toBuffer();
}
