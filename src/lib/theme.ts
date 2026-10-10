export type Theme = 'light' | 'dark';
export const THEME_KEY = 'theme';

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  return stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
}

export function toggleTheme(t: Theme): Theme {
  return t === 'dark' ? 'light' : 'dark';
}

// Inlined in <head> so a saved choice applies before first paint (no flash).
// Without a saved choice it does nothing and the CSS follows the system setting.
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
