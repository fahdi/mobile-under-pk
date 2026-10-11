import sharp from 'sharp';

export const PHOTO_WIDTH = 600;
export const PHOTO_HEIGHT = 800;
// Transparent breathing room so the phone never touches the frame edge.
export const PHOTO_MARGIN = 32;

// Normalise an official press photo: trim the uniform studio background,
// fit the phone into a fixed transparent canvas without cropping, encode WebP.
export async function processPhoto(input: Buffer): Promise<Buffer> {
  const trimmed = await sharp(input).trim({ threshold: 20 }).toBuffer();
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  return sharp(trimmed)
    .resize(PHOTO_WIDTH - 2 * PHOTO_MARGIN, PHOTO_HEIGHT - 2 * PHOTO_MARGIN, { fit: 'contain', background: clear })
    .extend({ top: PHOTO_MARGIN, bottom: PHOTO_MARGIN, left: PHOTO_MARGIN, right: PHOTO_MARGIN, background: clear })
    .webp({ quality: 80, alphaQuality: 90, effort: 5 })
    .toBuffer();
}
