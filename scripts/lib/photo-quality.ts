import sharp from 'sharp';

// Photo standard: one upright phone, front view, on a transparent background, nothing cut off.
// Runs on a processed photo (output of processPhoto).
export async function checkPhoto(webp: Buffer): Promise<string[]> {
  const { data, info } = await sharp(webp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const alpha = (x: number, y: number) => data[(y * W + x) * 4 + 3];
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (alpha(x, y) > 16) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  if (x1 < 0) return ['image is empty'];

  const problems: string[] = [];
  const ratio = (x1 - x0 + 1) / (y1 - y0 + 1);
  if (ratio < 0.36 || ratio > 0.62) problems.push(`not a single upright phone (width/height ${ratio.toFixed(2)}, expected 0.36 to 0.62)`);

  // A front-view phone has rounded corners, so the corners of its bounding box are see-through.
  const inset = 3;
  const corners = [[x0 + inset, y0 + inset], [x1 - inset, y0 + inset], [x0 + inset, y1 - inset], [x1 - inset, y1 - inset]];
  const opaque = corners.filter(([x, y]) => alpha(x, y) > 32).length;
  if (opaque > 0) problems.push(`background is not transparent or the phone is cut off (${opaque} of 4 corners opaque)`);
  // Glow or drop shadow: a lot of semi-transparent haze compared with the solid phone.
  let semi = 0;
  let solid = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 200) solid++;
    else if (data[i] > 8) semi++;
  }
  const haze = semi / Math.max(solid, 1);
  if (haze > MAX_HAZE) problems.push(`glow or shadow around the phone (${(haze * 100).toFixed(1)}% semi-transparent, max ${MAX_HAZE * 100}%)`);
  return problems;
}

export const MAX_HAZE = 0.05;
