import sharp from 'sharp';

export const PHOTO_WIDTH = 600;
export const PHOTO_HEIGHT = 800;
// Transparent breathing room so the phone never touches the frame edge.
export const PHOTO_MARGIN = 32;

// Normalise an official press photo: trim the uniform studio background,
// fit the phone into a fixed transparent canvas without cropping, encode WebP.
// Remove glow and drop shadow: keep solid pixels plus a thin anti-aliased rim, clear the rest.
async function stripHaze(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  let keep = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) keep[i] = data[i * 4 + 3] > 200 ? 1 : 0;
  for (let r = 0; r < 3; r++) {
    const next = keep.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!keep[i] && ((x > 0 && keep[i - 1]) || (x < W - 1 && keep[i + 1]) || (y > 0 && keep[i - W]) || (y < H - 1 && keep[i + W]))) next[i] = 1;
    }
    keep = next;
  }
  for (let i = 0; i < W * H; i++) if (!keep[i]) data[i * 4 + 3] = 0;
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

export async function processPhoto(input: Buffer): Promise<Buffer> {
  const trimmed = await sharp(await stripHaze(input)).trim({ threshold: 20 }).toBuffer();
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  return sharp(trimmed)
    .resize(PHOTO_WIDTH - 2 * PHOTO_MARGIN, PHOTO_HEIGHT - 2 * PHOTO_MARGIN, { fit: 'contain', background: clear })
    .extend({ top: PHOTO_MARGIN, bottom: PHOTO_MARGIN, left: PHOTO_MARGIN, right: PHOTO_MARGIN, background: clear })
    .webp({ quality: 80, alphaQuality: 90, effort: 5 })
    .toBuffer();
}
