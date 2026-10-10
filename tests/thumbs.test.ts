import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { makeThumb, thumbSrc, thumbSrcset, THUMB_WIDTHS } from '../src/lib/thumbs';

describe('thumbnail paths', () => {
  it('map a phone image to small and 2x thumbnails', () => {
    expect(THUMB_WIDTHS).toEqual([160, 320]);
    expect(thumbSrc('/images/phones/vivo-y29.webp', 160)).toBe('/thumbs/vivo-y29-160.webp');
    expect(thumbSrcset('/images/phones/vivo-y29.webp', '/base/')).toBe('/base/thumbs/vivo-y29-160.webp 160w, /base/thumbs/vivo-y29-320.webp 320w');
  });
});

describe('makeThumb', () => {
  it('outputs a 3:4 WebP at the requested width', async () => {
    const t = await makeThumb(readFileSync('public/images/phones/vivo-y29.webp'), 160);
    const m = await sharp(t).metadata();
    expect([m.format, m.width, m.height]).toEqual(['webp', 160, 213]);
  });

  it('keeps every real phone photo within budget: 8 KB at 160px, 16 KB at 320px', async () => {
    const over: string[] = [];
    for (const f of readdirSync('public/images/phones')) {
      const src = readFileSync(`public/images/phones/${f}`);
      for (const [w, max] of [[160, 8_000], [320, 16_000]] as const) {
        const size = (await makeThumb(src, w)).length;
        if (size > max) over.push(`${f}@${w}: ${size}`);
      }
    }
    expect(over).toEqual([]);
  }, 60_000);
});
