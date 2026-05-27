"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

type Theme = "light" | "dark";

interface ThemeContext {
  theme: Theme;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeContext>({ theme: "light", toggle: () => {} });

const STORAGE_KEY = "vt-theme";

export function useThemeProvider(): ThemeContext {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, toggle };
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export { ThemeCtx };
