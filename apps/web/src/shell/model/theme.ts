export const THEME_KEY = "gestao-manutencao-theme";
export const THEMES = ["light", "dark"] as const;
export type ThemeName = (typeof THEMES)[number];

export function isThemeName(value: string | null): value is ThemeName {
  return value === "light" || value === "dark";
}

export function readTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_KEY);
  if (isThemeName(stored)) return stored;
  const attr = document.documentElement.getAttribute("data-theme");
  return isThemeName(attr) ? attr : "light";
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
