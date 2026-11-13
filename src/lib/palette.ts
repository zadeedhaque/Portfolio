export type Mode = "dev" | "creator";
export type Theme = "auto" | "light" | "dark";
export type Section = "hero" | "work" | "about" | "off" | "studio" | "contact";
export type PaletteName = "blue" | "forest" | "plum" | "olive" | "paper" | "white" | "red" | "black" | "sage" | "teal";

/** Palette per section when the theme is Auto (colours follow the scroll). */
const BY_SECTION: Record<Mode, Record<Section, PaletteName>> = {
  dev: { hero: "blue", work: "forest", about: "plum", off: "olive", studio: "blue", contact: "forest" },
  creator: { hero: "white", work: "red", about: "black", off: "sage", studio: "teal", contact: "white" },
};

/** One calm palette for the whole page when the theme is Light or Dark. */
const FIXED: Record<Exclude<Theme, "auto">, Record<Mode, PaletteName>> = {
  light: { dev: "paper", creator: "white" },
  dark: { dev: "forest", creator: "black" },
};

export function resolvePalette(section: Section, mode: Mode, theme: Theme): PaletteName {
  return theme === "auto" ? BY_SECTION[mode][section] : FIXED[theme][mode];
}
