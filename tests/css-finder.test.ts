import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// A grid track of plain 1fr has a minimum of auto, so a wide table would widen the whole page.
const css = readFileSync('src/styles/global.css', 'utf8');

describe('finder layout', () => {
  it('never lets the results column grow past the screen', () => {
    const tracks = [...css.matchAll(/\.finder-layout\s*\{[^}]*grid-template-columns:\s*([^;]+);/g)].map((m) => m[1]);
    expect(tracks.length).toBeGreaterThanOrEqual(2);
    for (const t of tracks) expect(t.replace(/minmax\([^)]*\)/g, ''), t).not.toMatch(/1fr/);
  });

  it('keeps table thumbnails from collapsing in a squeezed table', () => {
    const rule = css.match(/\.thumb-cell img\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/max-width:\s*none/);
    expect(rule).toMatch(/min-width:\s*48px/);
  });

  it('hides the warranty and rank columns on phones and tightens cells, so the score stays on screen', () => {
    const mobile = css.match(/@media \(max-width: 760px\)\s*\{([^@]*)/)?.[1] ?? '';
    expect(mobile).toMatch(/\.col-warranty\s*\{\s*display:\s*none/);
    expect(mobile).toMatch(/\.col-rank\s*\{\s*display:\s*none/);
    expect(mobile).toMatch(/\.phone-table th, \.phone-table td\s*\{\s*padding:\s*8px/);
  });
});

describe('select boxes', () => {
  const rule = css.match(/(?:^|\n)select\s*\{([^}]*)\}/)?.[1] ?? '';
  it('replace the native arrow with one consistent chevron that has room to breathe', () => {
    expect(rule).toMatch(/appearance:\s*none/);
    expect(rule).toMatch(/background-image:\s*var\(--chevron\)/);
    expect(rule).toMatch(/background-position:\s*right\s+1[0-9]px\s+center/);
    expect(rule).toMatch(/padding-right:\s*(3[2-9]|4[0-9])px/);
  });
  it('draw the chevron in each theme', () => {
    const light = css.split(':root {')[1].split('}')[0];
    const dark = css.split(':root[data-theme="dark"]')[1].split('}')[0];
    expect(light).toMatch(/--chevron:\s*url\("data:image\/svg\+xml/);
    expect(dark).toMatch(/--chevron:\s*url\("data:image\/svg\+xml/);
  });
});
