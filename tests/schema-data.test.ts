import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BracketsFileSchema, BrandSchema, PresetSchema } from '../src/schema/data';
import { z } from 'zod';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('seed data files', () => {
  it('brands.json parses', () => {
    expect(z.array(BrandSchema).safeParse(read('data/brands.json')).success).toBe(true);
  });
  it('brackets.json has every price bracket in ascending order', () => {
    const b = BracketsFileSchema.parse(read('data/brackets.json'));
    expect(b.map((x) => x.ceiling)).toEqual([20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000, 150000, 350000, 450000, 650000]);
  });
  it('every bracket has 3 or 4 FAQs, with no em or en dashes', () => {
    for (const b of BracketsFileSchema.parse(read('data/brackets.json'))) {
      expect(b.faq.length, `bracket ${b.ceiling}`).toBeGreaterThanOrEqual(3);
      expect(b.faq.length, `bracket ${b.ceiling}`).toBeLessThanOrEqual(4);
      expect(JSON.stringify(b), `bracket ${b.ceiling}`).not.toMatch(/[\u2013\u2014]/);
    }
  });
  it('presets.json has the six spec presets with balanced first', () => {
    const p = z.array(PresetSchema).parse(read('data/presets.json'));
    expect(p.map((x) => x.slug)).toEqual(['balanced', 'camera-first', 'battery-first', 'gaming', 'safe-buy', 'value']);
    expect(p.find((x) => x.slug === 'safe-buy')?.requireOfficialWarranty).toBe(true);
  });
});

describe('schema rules', () => {
  it('rejects unsorted or duplicate bracket ceilings', () => {
    const mk = (c: number) => ({ ceiling: c, intro: 'Intro text for the bracket.', faq: [] });
    expect(BracketsFileSchema.safeParse([mk(30000), mk(20000)]).success).toBe(false);
    expect(BracketsFileSchema.safeParse([mk(20000), mk(20000)]).success).toBe(false);
  });
  it('rejects presets with unknown score keys or all-zero weights', () => {
    expect(PresetSchema.safeParse({ slug: 'x', name: 'X', description: 'Desc.', weights: { speed: 1 } }).success).toBe(false);
    expect(PresetSchema.safeParse({ slug: 'x', name: 'X', description: 'Desc.', weights: { camera: 0 } }).success).toBe(false);
  });
});
