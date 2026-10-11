import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { PHOTO_HEIGHT, PHOTO_WIDTH, processPhoto } from '../scripts/lib/photo';

const rgba = (b: Buffer, w: number, x: number, y: number) => [...b.subarray((y * w + x) * 4, (y * w + x) * 4 + 4)];

// A tall red "phone" centred on a big white press-shot background.
async function pressShot(): Promise<Buffer> {
  const phone = await sharp({ create: { width: 200, height: 400, channels: 3, background: '#d00000' } }).png().toBuffer();
  return sharp({ create: { width: 1000, height: 1000, channels: 3, background: '#ffffff' } })
    .composite([{ input: phone, left: 400, top: 300 }]).jpeg().toBuffer();
}

describe('processPhoto', () => {
  it('outputs a WebP of the fixed size', async () => {
    const out = await processPhoto(await pressShot());
    const meta = await sharp(out).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['webp', PHOTO_WIDTH, PHOTO_HEIGHT]);
    expect([PHOTO_WIDTH, PHOTO_HEIGHT]).toEqual([600, 800]);
  });

  it('trims the white background, fits the phone without cropping, pads with transparency', async () => {
    const out = await processPhoto(await pressShot());
    const { data } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const [r, g, b, a] = rgba(data, 600, 300, 400); // centre: phone
    expect(r).toBeGreaterThan(180); expect(g).toBeLessThan(40); expect(b).toBeLessThan(40); expect(a).toBe(255);
    // A transparent margin keeps the phone off the frame edge, so rounded UI corners can never clip it.
    const opaqueRows = Array.from({ length: 800 }, (_, y) => y).filter((y) => rgba(data, 600, 300, y)[3] > 16);
    expect(opaqueRows[0]).toBeGreaterThanOrEqual(24);
    expect(opaqueRows.at(-1)).toBeLessThanOrEqual(800 - 24);
    expect(rgba(data, 600, 300, 60)[0]).toBeGreaterThan(180); // still large: red near the top inside the margin
    expect(rgba(data, 600, 20, 400)[3]).toBe(0); // side padding is transparent, not white
  });

  it('keeps a noisy 2000px photo under 120 KB', async () => {
    const noise = await sharp(Buffer.from(Array.from({ length: 2000 * 2000 * 3 }, () => Math.floor(Math.random() * 256))),
      { raw: { width: 2000, height: 2000, channels: 3 } }).png().toBuffer();
    expect((await processPhoto(noise)).length).toBeLessThan(120_000);
  }, 30_000); // CPU-bound encode; slower when the suite runs in parallel

  it('rejects input that is not an image', async () => {
    await expect(processPhoto(Buffer.from('<html>not an image</html>'))).rejects.toThrow();
  });
});
