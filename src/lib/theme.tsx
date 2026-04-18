import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('horeca-theme') as Theme | null;
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('horeca-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return <Ctx.Provider value={{ theme, setTheme, toggleTheme }}>{children}</Ctx.Provider>;
};

export const useTheme = (): ThemeCtx => {
  const c = useContext(Ctx);
  if (c) return c;
  // Fallback for cases where component renders outside provider (e.g., HMR)
  return {
    theme: 'light',
    setTheme: () => {},
    toggleTheme: () => {
      const root = document.documentElement;
      const isDark = root.classList.toggle('dark');
      try { localStorage.setItem('horeca-theme', isDark ? 'dark' : 'light'); } catch {}
    },
  };
};
