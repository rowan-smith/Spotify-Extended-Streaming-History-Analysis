import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'system' | Theme;

const STORAGE_KEY = 'spotify-history-theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredPreference(): ThemePreference | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'system' || stored === 'light' || stored === 'dark') {
    return stored;
  }

  return null;
}

function getInitialPreference(): ThemePreference {
  return getStoredPreference() ?? 'system';
}

function updateFavicon(theme: Theme) {
  const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
  if (!favicon) {
    return;
  }

  favicon.href = theme === 'dark' ? './favicon-dark.svg' : './favicon.svg';
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const theme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    updateFavicon(theme);
  }, [theme]);

  useEffect(() => {
    if (preference !== 'system') {
      return undefined;
    }

    const media = window.matchMedia('(prefers-color-scheme: light)');

    function handleChange(event: MediaQueryListEvent) {
      setSystemTheme(event.matches ? 'light' : 'dark');
    }

    setSystemTheme(getSystemTheme());
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [preference]);

  function setTheme(next: ThemePreference) {
    setPreference(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return { theme, preference, setTheme };
}
