import type { Mode, Theme } from "./palette";

const MODES: readonly string[] = ["dev", "creator"];
const THEMES: readonly string[] = ["auto", "light", "dark"];

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode, strict settings)
  }
}

/** Saved mode and theme, falling back to Developer / Auto. Never throws. */
export function readPrefs(): { mode: Mode; theme: Theme } {
  const mode = get("mode");
  const theme = get("theme");
  return {
    mode: mode !== null && MODES.includes(mode) ? (mode as Mode) : "dev",
    theme: theme !== null && THEMES.includes(theme) ? (theme as Theme) : "auto",
  };
}

/** Saves a preference. Never throws; the choice still holds for this page view. */
export function writePref(key: "mode" | "theme", value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}

export function nextTheme(t: Theme): Theme {
  return t === "auto" ? "light" : t === "light" ? "dark" : "auto";
}
