import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { checkPhoto } from '../scripts/lib/photo-quality';
import { processPhoto } from '../scripts/lib/photo';

// A front-view phone: a rounded, upright rectangle.
const phone = (x: number, w = 300, h = 620) => `<rect x="${x}" y="90" width="${w}" height="${h}" rx="44" fill="#223344"/>`;
const svg = (body: string, bg = 'none', width = 400) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="800"><rect width="100%" height="100%" fill="${bg}"/>${body}</svg>`);
const processed = async (body: string, bg?: string, width?: number) => processPhoto(await sharp(svg(body, bg, width)).png().toBuffer());

describe('checkPhoto', () => {
  it('accepts a single upright phone on a transparent background', async () => {
    expect(await checkPhoto(await processed(phone(50)))).toEqual([]);
  });

  it('rejects a phone sitting in an opaque white box', async () => {
    const problems = await checkPhoto(await processPhoto(await sharp(svg(phone(50), '#ffffff')).jpeg().toBuffer()));
    expect(problems.join()).toMatch(/background is not transparent/);
  });

  it('rejects a phone cut off by the frame (square corners at the edge)', async () => {
    const cut = `<rect x="50" y="0" width="300" height="800" rx="0" fill="#223344"/>`;
    expect((await checkPhoto(await processed(cut))).join()).toMatch(/cut off|not transparent/);
  });

  it('rejects two phones side by side and wide group shots', async () => {
    expect((await checkPhoto(await processed(phone(40, 260) + phone(420, 260), 'none', 720))).join()).toMatch(/not a single upright phone/);
  });

  it('rejects an angled or landscape shot', async () => {
    const landscape = `<rect x="20" y="300" width="360" height="200" rx="40" fill="#223344"/>`;
    expect((await checkPhoto(await processed(landscape))).join()).toMatch(/not a single upright phone/);
  });

  it('rejects a glow or drop shadow (semi-transparent haze) around the phone', async () => {
    const haze = `<defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter></defs>
      <rect x="60" y="100" width="300" height="620" rx="44" fill="#ff8800" opacity="0.6" filter="url(#g)"/>` + phone(50);
    // Straight to WebP: processPhoto now strips haze, but the checker must still catch it in any image.
    const raw = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">${haze}</svg>`)).webp().toBuffer();
    expect((await checkPhoto(raw)).join()).toMatch(/glow or shadow/);
  });

  it('still accepts normal anti-aliased edges', async () => {
    expect(await checkPhoto(await processed(phone(50)))).toEqual([]);
  });
});
