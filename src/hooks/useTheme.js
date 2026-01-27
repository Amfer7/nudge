import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "fitness_theme";

export function useTheme() {
  const [theme, setTheme] = useState("dark");
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTheme(stored);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;

    localStorage.setItem(STORAGE_KEY, theme);

    const root = document.documentElement;

    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.dataset.theme = prefersDark ? "dark" : "light";
    } else {
      root.dataset.theme = theme;
    }
  }, [theme]);

  return { theme, setTheme };
}
