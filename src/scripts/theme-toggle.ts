import { resolveTheme, THEME_KEY, toggleTheme, type Theme } from '../lib/theme';

type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };
type Media = { matchMedia(q: string): { matches: boolean } };

export function initThemeToggle(doc: Document, win: Media, storage: Storage): void {
  const btn = doc.getElementById('theme-toggle');
  if (!btn) return;
  const root = doc.documentElement;
  const current = (): Theme => resolveTheme(root.dataset.theme ?? null, win.matchMedia('(prefers-color-scheme: dark)').matches);
  const label = () => {
    const next = toggleTheme(current());
    btn.setAttribute('aria-label', `Switch to ${next} theme`);
    btn.setAttribute('title', `Switch to ${next} theme`);
  };
  btn.addEventListener('click', () => {
    const next = toggleTheme(current());
    root.dataset.theme = next;
    try { storage.setItem(THEME_KEY, next); } catch { /* private mode: still switch for this page */ }
    label();
  });
  label();
}
