import { useState } from "react";
import { applyTheme, readTheme, type ThemeName } from "../model/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeName>(() => readTheme());
  const next: ThemeName = theme === "light" ? "dark" : "light";

  function choose(value: ThemeName) {
    applyTheme(value);
    setTheme(value);
  }

  return (
    <button
      type="button"
      aria-pressed={theme === "dark"}
      aria-label={next === "dark" ? "Escuro" : "Claro"}
      onClick={() => choose(next)}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-chip text-app transition hover:bg-accent-soft ${className}`}
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.1 5.1l1.8 1.8M17.1 17.1l1.8 1.8M18.9 5.1l-1.8 1.8M6.9 17.1l-1.8 1.8"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinejoin="round" d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" />
    </svg>
  );
}
