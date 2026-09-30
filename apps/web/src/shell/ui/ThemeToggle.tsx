import { useState } from "react";
import { applyTheme, readTheme, type ThemeName } from "../model/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeName>(() => readTheme());

  function choose(next: ThemeName) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className={`grid grid-cols-2 gap-1 rounded-control border border-line bg-surface p-1 ${className}`}>
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => choose("light")}
        className={`rounded-control px-3 py-2 text-sm font-medium ${theme === "light" ? "bg-accent text-accent-contrast" : "text-muted"}`}
      >
        Claro
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => choose("dark")}
        className={`rounded-control px-3 py-2 text-sm font-medium ${theme === "dark" ? "bg-accent text-accent-contrast" : "text-muted"}`}
      >
        Escuro
      </button>
    </div>
  );
}
