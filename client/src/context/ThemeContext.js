"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  showGrid: true,
  toggleGrid: () => {},
  setShowGrid: () => {},
  canvasBg: '#121214',
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('dark');
  const [showGrid, setShowGridState] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('doodlelobby-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setThemeState('light');
      }

      const savedGrid = localStorage.getItem('doodlelobby-grid');
      if (savedGrid !== null) {
        setShowGridState(savedGrid === 'true');
      }
    } catch (e) {
      // Ignore localStorage errors
    } finally {
      setMounted(true);
    }
  }, []);

  // Sync with document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('doodlelobby-theme', newTheme);
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  const setShowGrid = useCallback((show) => {
    setShowGridState(show);
    try {
      localStorage.setItem('doodlelobby-grid', String(show));
    } catch (e) {}
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGridState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('doodlelobby-grid', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const canvasBg = theme === 'dark' ? '#121214' : '#F8F9FA';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        showGrid,
        toggleGrid,
        setShowGrid,
        canvasBg,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
