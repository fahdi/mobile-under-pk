import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { checkPhoto } from '../scripts/lib/photo-quality';

const photos = readdirSync('public/images/phones').filter((f) => f.endsWith('.webp')).map((f) => f.replace('.webp', '')).sort();

describe('every committed phone photo meets the standard', () => {
  it.each(photos)('%s', async (slug) => {
    expect(await checkPhoto(readFileSync(`public/images/phones/${slug}.webp`))).toEqual([]);
  });
});
