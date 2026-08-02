import { useEffect, useState } from "react";
import { repo } from "../lib/repo";

export function useTheme() {
  // Hydrate once via a lazy initializer.
  const [theme, setTheme] = useState(() => repo.getTheme());

  useEffect(() => {
    repo.saveTheme(theme);

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
