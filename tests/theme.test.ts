// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveTheme, THEME_BOOT_SCRIPT, THEME_KEY, toggleTheme } from '../src/lib/theme';
import { initThemeToggle } from '../src/scripts/theme-toggle';

const root = () => document.documentElement;
const memoryStorage = (initial: Record<string, string> = {}) => {
  const m = new Map(Object.entries(initial));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, dump: () => Object.fromEntries(m) };
};
const brokenStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
const prefers = (dark: boolean) => ({ matchMedia: (q: string) => ({ matches: dark && q.includes('dark') }) });

beforeEach(() => {
  delete root().dataset.theme;
  document.body.innerHTML = '<button id="theme-toggle" type="button"></button>';
});

describe('resolveTheme and toggleTheme', () => {
  it('uses a saved choice, otherwise the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme('purple', false)).toBe('light');
  });
  it('flips', () => {
    expect(toggleTheme('light')).toBe('dark');
    expect(toggleTheme('dark')).toBe('light');
  });
});

describe('boot script (runs in <head> before paint)', () => {
  const boot = (storage: unknown) => new Function('localStorage', THEME_BOOT_SCRIPT)(storage);

  it('applies a saved theme', () => {
    boot(memoryStorage({ [THEME_KEY]: 'dark' }));
    expect(root().dataset.theme).toBe('dark');
  });
  it('leaves the attribute unset with no or a bad saved value, so CSS follows the system', () => {
    boot(memoryStorage());
    expect(root().dataset.theme).toBeUndefined();
    boot(memoryStorage({ [THEME_KEY]: '<script>' }));
    expect(root().dataset.theme).toBeUndefined();
  });
  it('never throws when storage is blocked', () => {
    expect(() => boot(brokenStorage)).not.toThrow();
  });
  it('stays tiny', () => {
    expect(THEME_BOOT_SCRIPT.length).toBeLessThan(300);
  });
});

describe('theme toggle button', () => {
  it('starts from the system theme, flips it, saves it and labels the next action', () => {
    const storage = memoryStorage();
    initThemeToggle(document, prefers(true), storage);
    const btn = document.getElementById('theme-toggle')!;
    expect(btn.getAttribute('aria-label')).toBe('Switch to light theme');
    btn.click();
    expect(root().dataset.theme).toBe('light');
    expect(storage.dump()).toEqual({ [THEME_KEY]: 'light' });
    expect(btn.getAttribute('aria-label')).toBe('Switch to dark theme');
    btn.click();
    expect(root().dataset.theme).toBe('dark');
  });
  it('respects a theme the boot script already applied', () => {
    root().dataset.theme = 'dark';
    initThemeToggle(document, prefers(false), memoryStorage());
    expect(document.getElementById('theme-toggle')!.getAttribute('aria-label')).toBe('Switch to light theme');
  });
  it('still switches when storage is blocked', () => {
    initThemeToggle(document, prefers(false), brokenStorage);
    document.getElementById('theme-toggle')!.click();
    expect(root().dataset.theme).toBe('dark');
  });
});

describe('stylesheet tokens', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');
  const block = (selector: string) => css.split(selector)[1]?.split('}')[0] ?? '';
  const tokens = (body: string) => Object.fromEntries([...body.matchAll(/(--[a-z-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

  it('defines the same dark tokens for the system preference and for an explicit choice', () => {
    const system = tokens(block(':root:not([data-theme="light"])'));
    const explicit = tokens(block(':root[data-theme="dark"]'));
    expect(Object.keys(system).length).toBeGreaterThanOrEqual(7);
    expect(explicit).toEqual(system);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)/);
  });
  it('sets color-scheme per theme so native controls match', () => {
    expect(block(':root[data-theme="dark"]')).toContain('color-scheme: dark');
    expect(block(':root {')).toContain('color-scheme: light');
  });
});
