// Mode switch, theme button, scroll-driven palettes, reveal-on-scroll and the progress bar.
// After each change this dispatches `modechange` / `palettechange` on window so the
// game and the fluid background can follow.
import { resolvePalette, type Mode, type PaletteName, type Section, type Theme } from "../lib/palette";
import { nextTheme, readPrefs, writePref } from "../lib/prefs";

const THEME_UI: Record<Theme, [glyph: string, label: string]> = { auto: ["◐", "Auto"], light: ["☀", "Light"], dark: ["☾", "Dark"] };

export function initSite(): void {
  const root = document.documentElement;
  const body = document.body;
  root.classList.add("js");

  const zones = [...document.querySelectorAll<HTMLElement>("[data-section]")];
  const prefs = readPrefs();
  let mode: Mode = prefs.mode;
  let theme: Theme = prefs.theme;
  let current: Section = (zones[0]?.dataset.section as Section | undefined) ?? "hero";

  const mark = document.getElementById("mark");
  function applyPalette(): void {
    const pal: PaletteName = resolvePalette(current, mode, theme);
    if (body.dataset.pal !== pal) {
      body.dataset.pal = pal;
      if (mark) {
        // Restart the header logo's pop animation.
        mark.classList.remove("pop-in");
        void mark.offsetWidth;
        mark.classList.add("pop-in");
      }
    }
    window.dispatchEvent(new CustomEvent<PaletteName>("palettechange", { detail: pal }));
  }

  // ---- Mode -------------------------------------------------------------
  const modeButtons = [...document.querySelectorAll<HTMLButtonElement>(".switch button")];
  function setMode(next: Mode, save: boolean): void {
    mode = next;
    root.dataset.mode = next;
    for (const b of modeButtons) b.setAttribute("aria-pressed", String(b.dataset.set === next));
    applyPalette();
    if (save) writePref("mode", next);
    window.dispatchEvent(new CustomEvent<Mode>("modechange", { detail: next }));
  }
  for (const b of modeButtons) b.addEventListener("click", () => setMode(b.dataset.set === "creator" ? "creator" : "dev", true));
  document.getElementById("flip")?.addEventListener("click", () => setMode(mode === "dev" ? "creator" : "dev", true));

  // ---- Theme ------------------------------------------------------------
  const themeBtn = document.getElementById("theme");
  function setTheme(next: Theme, save: boolean): void {
    theme = next;
    root.dataset.theme = next;
    if (themeBtn) {
      const [glyph, label] = THEME_UI[next];
      if (themeBtn.firstElementChild) themeBtn.firstElementChild.textContent = glyph;
      if (themeBtn.lastElementChild) themeBtn.lastElementChild.textContent = label;
      themeBtn.setAttribute("aria-label", `Colour theme: ${label.toLowerCase()}. Press to change.`);
    }
    applyPalette();
    if (save) writePref("theme", next);
  }
  themeBtn?.addEventListener("click", () => setTheme(nextTheme(theme), true));

  // ---- Palette follows the section crossing the middle of the screen ------
  const palWatch = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        current = (e.target as HTMLElement).dataset.section as Section;
        applyPalette();
      }
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  for (const z of zones) palWatch.observe(z);

  // ---- Reveal on scroll ---------------------------------------------------
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        reveal.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (const n of document.querySelectorAll(".rv")) reveal.observe(n);

  // ---- Progress bar, and the page-end palette rule -------------------------
  const progress = document.getElementById("progress");
  const last = zones[zones.length - 1];
  function onScroll(): void {
    const max = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    // The last section can be too short to reach mid-screen, so switch to it at the page end.
    if (last && max > 0 && scrollY >= max - 80) {
      const s = last.dataset.section as Section;
      if (current !== s) {
        current = s;
        applyPalette();
      }
    }
  }
  addEventListener("scroll", onScroll, { passive: true });

  setMode(mode, false);
  setTheme(theme, false);
  onScroll();
}
