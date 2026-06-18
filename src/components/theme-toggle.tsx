"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

export const THEME_MODE_KEY = "nook-theme-mode";

// Inline init script — runs in <head> before paint so the stored (or system)
// mode is applied with no flash. Mirrors the resolution order used below:
// explicit stored choice → prefers-color-scheme → light.
export const themeInitScript = `(function(){try{var m=localStorage.getItem('${THEME_MODE_KEY}');if(!m){m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(m==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export function ThemeToggle() {
  // null until mounted — server can't know the client's resolved mode.
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    // Source of truth is whatever the init script already applied to <html>.
    setMode(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  function set(next: Mode) {
    setMode(next);
    try {
      localStorage.setItem(THEME_MODE_KEY, next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const other: Mode = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => set(other)}
      aria-label={mode ? `Switch to ${other} mode` : "Toggle light or dark mode"}
    >
      <span className="theme-toggle-opt" data-active={mode === "light" || undefined}>
        light
      </span>
      <span className="theme-toggle-sep" aria-hidden="true">
        ·
      </span>
      <span className="theme-toggle-opt" data-active={mode === "dark" || undefined}>
        dark
      </span>
    </button>
  );
}
