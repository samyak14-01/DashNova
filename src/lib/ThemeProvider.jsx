import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme definitions: each sets dark mode + a primary hue
export const THEMES = [
  { id: 'light',  label: 'Light',  dark: false, primary: '243 75% 59%', emoji: '☀️' },
  { id: 'dark',   label: 'Dark',   dark: true,  primary: '243 75% 59%', emoji: '🌙' },
  { id: 'ocean',  label: 'Ocean',  dark: true,  primary: '213 90% 55%', emoji: '🌊' },
  { id: 'forest', label: 'Forest', dark: false, primary: '142 70% 40%', emoji: '🌿' },
  { id: 'rose',   label: 'Rose',   dark: false, primary: '346 80% 58%', emoji: '🌸' },
  { id: 'violet', label: 'Violet', dark: true,  primary: '270 85% 60%', emoji: '💜' },
];

const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(themeId) {
  const def = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  root.classList.toggle('dark', def.dark);
  root.style.setProperty('--primary', def.primary);
  root.style.setProperty('--ring', def.primary);
  root.style.setProperty('--sidebar-primary', def.primary);
}

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });

  const setTheme = (id) => {
    setThemeState(id);
    localStorage.setItem('app-theme', id);
    applyTheme(id);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}