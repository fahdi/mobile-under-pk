import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { checkPhoto } from '../scripts/lib/photo-quality';

// Phones whose brands publish no compliant image yet. This list may only shrink:
// the test fails if one of these starts passing, so it gets removed here.
const PENDING = new Set([
  'honor-play-10', 'honor-x7c', 'honor-x9d', 'infinix-hot-60-pro', 'infinix-hot-60i', 'infinix-smart-9-hd',
  'itel-a100c', 'itel-a90', 'itel-super-26-ultra', 'oppo-a6s-pro', 'oppo-a6s', 'realme-note-60x', 'realme-note-70',
  'vivo-v60', 'vivo-y05', 'vivo-y11d', 'vivo-y29', 'zte-nubia-a36',
]);

const photos = readdirSync('public/images/phones').filter((f) => f.endsWith('.webp')).map((f) => f.replace('.webp', '')).sort();

describe('every committed phone photo meets the standard', () => {
  it.each(photos)('%s', async (slug) => {
    const problems = await checkPhoto(readFileSync(`public/images/phones/${slug}.webp`));
    if (PENDING.has(slug)) expect(problems.length, `${slug} now passes: remove it from PENDING`).toBeGreaterThan(0);
    else expect(problems).toEqual([]);
  });
});
