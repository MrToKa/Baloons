import { useEffect, useMemo, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'auto';

const THEME_KEY = 'theme-preference';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

const getSystemTheme = (): Exclude<ThemePreference, 'auto'> => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
};

export const getStoredTheme = (): ThemePreference => {
  if (typeof localStorage === 'undefined') return 'auto';
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'auto') return raw;
    return 'auto';
  } catch {
    return 'auto';
  }
};

export const setStoredTheme = (pref: ThemePreference) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Ignore storage issues.
  }
};

export const applyTheme = (pref: ThemePreference) => {
  const root = document.documentElement;
  const resolved = pref === 'auto' ? getSystemTheme() : pref;
  root.classList.toggle('dark', resolved === 'dark');
  return resolved;
};

export const applyStoredTheme = () => applyTheme(getStoredTheme());

export function useThemePreference() {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    setStoredTheme(theme);
  }, [theme]);

  const matcher = useMemo(
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(MEDIA_QUERY) : null),
    [],
  );

  useEffect(() => {
    if (!matcher) return;
    const handle = () => {
      if (theme === 'auto') applyTheme(theme);
    };
    matcher.addEventListener ? matcher.addEventListener('change', handle) : matcher.addListener(handle);
    return () => {
      matcher.removeEventListener ? matcher.removeEventListener('change', handle) : matcher.removeListener(handle);
    };
  }, [matcher, theme]);

  const setTheme = (pref: ThemePreference) => setThemeState(pref);

  return { theme, setTheme };
}
