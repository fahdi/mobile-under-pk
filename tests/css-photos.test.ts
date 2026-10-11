import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Phone photos are transparent renders: no tile behind them and no rounding that could clip them.
const css = readFileSync('src/styles/global.css', 'utf8');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }));
const photoRules = rules.filter((r) => /(phone-photo|pick-photo|phone-card|compare-table thead|brand-card)[^,{]*\bimg\b/.test(r.selector));

describe('phone photo styling', () => {
  it('finds the photo rules', () => {
    expect(photoRules.length).toBeGreaterThanOrEqual(4);
  });
  it.each(photoRules.map((r) => [r.selector, r.body]))('%s has no opaque tile and no rounded corners', (_, body) => {
    expect(body).not.toMatch(/background\s*:\s*#(fff|ffffff)\b/i);
    expect(body).not.toMatch(/border-radius/);
  });
});
