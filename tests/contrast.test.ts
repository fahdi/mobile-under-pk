import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// WCAG relative luminance and contrast ratio.
const lum = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const css = readFileSync('src/styles/global.css', 'utf8');
const tokens = (selector: string) => Object.fromEntries([...(css.split(selector)[1]?.split('}')[0] ?? '').matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})/g)].map((m) => [m[1], m[2]]));
const themes = { light: tokens(':root {'), dark: tokens(':root[data-theme="dark"]') };

// Text colour on the background it sits on.
const pairs: Array<[string, string]> = [
  ['--fg', '--bg'], ['--muted', '--bg'], ['--accent', '--bg'], ['--fg', '--surface'], ['--muted', '--surface'],
  ['--accent', '--surface'], ['--warn', '--warn-bg'], ['--on-accent', '--accent'], ['--accent', '--accent-weak'],
];

describe.each(Object.entries(themes))('%s theme contrast', (_, t) => {
  it.each(pairs)('%s on %s meets WCAG AA (4.5:1)', (fg, bg) => {
    expect(t[fg], fg).toBeDefined();
    expect(t[bg], bg).toBeDefined();
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
