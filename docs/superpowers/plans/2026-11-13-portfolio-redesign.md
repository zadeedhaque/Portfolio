# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-written static site in this repo with an Astro static site that matches the approved demo: a playable name-breakout hero, Developer / Creator modes, scroll-reactive palettes, dot-grid fluid backgrounds, a page per project and an Academics page.

**Architecture:** Astro generates plain HTML from typed data files. All behaviour is small hand-written TypeScript modules, each split into a pure, unit-tested core (game engine, wave sim, gas sim, palette resolver) and a thin DOM/canvas mount. No UI framework and no 3D library.

**Tech Stack:** Astro (latest stable; pin the installed version), TypeScript strict, Vitest (unit), Playwright + `@axe-core/playwright` (end-to-end), `@fontsource-variable/space-grotesk`, `@fontsource-variable/inter`, raw WebGL2. Deploys to Vercel as static output.

**Spec:** `docs/superpowers/specs/2026-11-13-portfolio-redesign-design.md`

**Reference build:** `docs/superpowers/reference/demo/index.html` is the approved look, copy, palette values, shader and tuning constants. Port from it; where this plan and the demo disagree, the spec wins, then this plan.

## Global Constraints

- Fonts: Space Grotesk 500/700 for headings, Inter 400/500/700 for everything else, self-hosted. No monospace font anywhere.
- No inline `<script>`, no inline `style=""` attributes and no third-party origins in the built HTML. Setting styles from JS (`el.style.x = …`) is allowed.
- No UI framework, no three.js. Game, cursor, glass logo and fluids are hand-written.
- `prefers-reduced-motion: reduce`: no custom cursor, no ripples, no fluid canvas, no reveal animation, glass logo does not auto-spin, game waits for a tap.
- WCAG AA contrast on every palette; visible focus; 44 px minimum touch targets; game and glass logo usable by keyboard.
- All motion is time-based (multiply by frame delta), never per-frame constants. The demo was measured at about 200 fps on the owner's display.
- External links: `target="_blank" rel="noopener noreferrer"`.
- Page `<title>` suffix is "Zadeed Haque", never "Zeedio".
- Demo-only helpers must not ship: the font picker button and the `#bonus` shortcut.
- Image and video positions are empty slots. Do not carry over any image from `assets/`, `source-art/` or `videos/`.
- Logo: crop tiles from `public/logo-sheet.webp` exactly as the demo's `.logo` rule does, until separate files arrive.
- Verify Astro config key names against the docs for the installed version before using them; the build-output test in Task 1 is the authority on whether the constraint holds.

## Review Focus

1. Storage blocked (private mode, `localStorage` throws): the site loads in Developer / Auto with no error, and switches still work for the session. Test in Task 3.
2. WebGL2 missing or context creation fails: plain background, no console error, everything else works. Test in Task 6.
3. Very high refresh rate, and a tab resumed after minutes in the background (huge frame delta): game and fluids run at the same speed and the ball never tunnels through the paddle or bricks. Tests in Tasks 5 and 6.
4. Resize or rotation mid-game: bricks re-lay out, no `NaN` positions, play continues. Test in Task 5.
5. JavaScript disabled: all Developer content is visible and readable (nothing stuck at `opacity: 0`), links work. Test in Task 4.

---

## File Structure

```
astro.config.mjs, tsconfig.json, package.json, vercel.json
playwright.config.ts, vitest.config.ts
public/logo-sheet.webp, public/boot.js
src/styles/tokens.css        palettes and type tokens
src/styles/base.css          resets, layout, components
src/data/projects.ts         10 Developer projects
src/data/roles.ts            7 Creator roles
src/data/academics.ts        timeline and coursework
src/content/case-studies/*.md   one per project + cloud-computing
src/content.config.ts
src/lib/palette.ts           resolvePalette, section maps
src/lib/prefs.ts             mode/theme read-write, storage-safe
src/game/font.ts, engine.ts, render.ts, mount.ts
src/fluid/wave.ts, gas.ts, renderer.ts, mount.ts
src/scripts/site.ts          mode switch, theme button, scroll palette, reveal, progress
src/scripts/cursor.ts, ripple.ts, tilt.ts, glass.ts
src/components/*.astro       Header, Footer, Hero, WorkGrid, Card, About, OffClock, Studio, Contact, VideoSlot, Logo
src/layouts/Base.astro
src/pages/index.astro, 404.astro, work/[slug].astro, academics/index.astro, academics/cloud-computing.astro
tests/unit/*.test.ts, tests/e2e/*.spec.ts
```

---

### Task 1: Scaffold, tokens, base layout, security headers

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json`, `.gitignore`, `public/logo-sheet.webp`, `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/Logo.astro`, `src/pages/index.astro`
- Test: `tests/e2e/build-output.spec.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description: string }`, rendering `<body data-pal="blue">` and `<html data-mode="dev" data-theme="auto">`. `Logo.astro` props `{ size?: number; id?: string }`. npm scripts: `dev`, `build`, `preview`, `test` (vitest run), `e2e` (playwright against `astro preview` on port 4321).
- Produces CSS custom properties on `body[data-pal=…]`: `--bg --surface --line --text --muted --accent --accent-text --on-accent --lx --ly`. Palette names: `blue forest plum olive paper white red black sage teal`. Copy every value from the demo's `body[data-pal="…"]` rules.

- [ ] **Step 1: Scaffold.** Create an empty Astro project in the repo root with TypeScript strict; add Vitest, Playwright, `@axe-core/playwright`, the two fontsource packages. Copy `docs/superpowers/reference/demo/assets/logo-sheet.webp` to `public/`. Leave the old `*.html`, `css/`, `js/` files in place for now; Task 9 removes them. Old root `*.html` files are not inside `src/`, so they do not affect the build.

- [ ] **Step 2: Write the failing build-output test** (`tests/e2e/build-output.spec.ts`, reads `dist/` from disk, no browser):

```ts
test("built HTML has no inline script, inline style attribute or third-party origin", () => {
  for (const file of htmlFilesUnder("dist")) {
    const html = readFileSync(file, "utf8");
    expect(html, file).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>[^<]/);   // no inline script bodies
    expect(html, file).not.toMatch(/\sstyle="/);
    expect(html, file).not.toMatch(/https?:\/\/(fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr)/);
  }
});
test("vercel.json sets the security headers", () => {
  const h = headersFor("/(.*)");
  expect(h["Content-Security-Policy"]).toContain("default-src 'self'");
  expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  expect(h["Content-Security-Policy"]).not.toContain("'unsafe-inline'");
  expect(h["X-Content-Type-Options"]).toBe("nosniff");
  expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  expect(h["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains; preload");
});
```

- [ ] **Step 3: Run it.** `npm run build && npx playwright test build-output` → FAIL (no `vercel.json`; default Astro output may inline small scripts or styles).

- [ ] **Step 4: Implement.** `vercel.json` with the headers above; full CSP: `default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'`. Configure Astro so scripts and stylesheets are always emitted as external files. `tokens.css`: the ten palettes plus `--font`, `--display`, `--radius: 18px`, `--wrap: 1180px`, `--ease: cubic-bezier(.2,.7,.2,1)`. `base.css`: port the demo's non-palette CSS; stagger delays become classes `.d1 .d2 .d3` instead of inline `--i`. `Header.astro`: brand (Logo + "Zadeed Haque"), nav `Work /#work`, `About /#about`, `Academics /academics`, `Contact /#contact`, mode switch buttons `data-set="dev"` labelled "Developer" and `data-set="creator"` labelled "Creator", theme button `#theme`. `Footer.astro`: "© 2026 Zadeed Haque · Melbourne".

- [ ] **Step 5: Smoke test** (`tests/e2e/smoke.spec.ts`): home returns 200, `<title>` is "Zadeed Haque", zero console errors, `document.fonts.check('700 20px "Space Grotesk Variable"')` true, no element computes a font-family containing "Mono", no horizontal scroll at 375 px.

- [ ] **Step 6: Run all.** `npm run build && npm run e2e` → PASS.

- [ ] **Step 7: Commit** `feat: scaffold Astro site with tokens, layout and security headers`.

---

### Task 2: Content data and case studies

**Files:**
- Create: `src/data/projects.ts`, `src/data/roles.ts`, `src/data/academics.ts`, `src/content.config.ts`, `src/content/case-studies/{lava-lift,learn-salah,dhakar-rasta,physics-lab,crownfall,neon-snake,handwritten-numbers,medicare-bd,spin-and-win,60-projects,cloud-computing}.md`
- Test: `tests/unit/data.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Project { slug: string; name: string; summary: string; tags: [string, string]; play?: string; code?: string; video?: string; poster?: string }
export const projects: Project[]            // 10, in the demo's order
export interface Role { name: string; summary: string; tags: string[]; watch?: string }
export const roles: Role[]                  // 7
export interface TimelineRow { when: string; what: string }
export const devTimeline: TimelineRow[]; export const creatorTimeline: TimelineRow[]
export const study: { when: string; school: string; detail: string }[]   // Swinburne, BRAC (CGPA 3.64 / 4.00), Rajuk (GPA 5.00 / 5.00)
export const scores: string[]               // "IELTS 7.5", "SAT 1300", "Creative IT · Graphic Design"
export const coursework: { name: string; summary: string; href?: string }[]   // 4; Cloud Computing has href "/academics/cloud-computing"
```
- Content collection `case-studies`, schema `{ title: string }`, entry id equals the project slug.

- [ ] **Step 1: Write the failing test:**

```ts
test("ten projects with unique slugs and https links", () => {
  expect(projects).toHaveLength(10);
  expect(new Set(projects.map(p => p.slug)).size).toBe(10);
  for (const p of projects) for (const url of [p.play, p.code]) if (url) expect(url).toMatch(/^https:\/\//);
});
test("no project ships a video yet", () => { for (const p of projects) expect(p.video).toBeUndefined(); });
test("every project has a case study file, plus cloud-computing", () => {
  for (const slug of [...projects.map(p => p.slug), "cloud-computing"]) expect(existsSync(`src/content/case-studies/${slug}.md`)).toBe(true);
});
test("seven roles, four coursework items", () => { expect(roles).toHaveLength(7); expect(coursework).toHaveLength(4); });
```

- [ ] **Step 2: Run** `npm test -- data` → FAIL.

- [ ] **Step 3: Implement.** Names, summaries, tags and URLs: copy from the demo's `DATA` object. Case-study bodies: migrate the text of each `<div class="case">` modal in the old `work.html` to Markdown, keeping its headings (How it works, What I built, Key skills, Tech stack and so on); `cloud-computing.md` from the old `cloud-computing.html`. Drop every `<img>` and inline SVG diagram; where one stood, leave nothing.

- [ ] **Step 4: Run** `npm test -- data` → PASS. **Step 5: Commit** `feat: add project, role and academics data with migrated case studies`.

---

### Task 3: Preferences and palette resolution

**Files:**
- Create: `src/lib/palette.ts`, `src/lib/prefs.ts`, `public/boot.js`
- Test: `tests/unit/palette.test.ts`, `tests/unit/prefs.test.ts`, `tests/e2e/prefs.spec.ts`

**Interfaces:**
- Produces:

```ts
export type Mode = "dev" | "creator"; export type Theme = "auto" | "light" | "dark";
export type Section = "hero" | "work" | "about" | "off" | "studio" | "contact";
export type PaletteName = "blue" | "forest" | "plum" | "olive" | "paper" | "white" | "red" | "black" | "sage" | "teal";
export function resolvePalette(section: Section, mode: Mode, theme: Theme): PaletteName
export function readPrefs(): { mode: Mode; theme: Theme }      // never throws
export function writePref(key: "mode" | "theme", value: string): void   // never throws
export function nextTheme(t: Theme): Theme                     // auto → light → dark → auto
```
- `public/boot.js`: a classic script loaded in `<head>` before first paint that sets `data-mode` and `data-theme` on `<html>` from storage, inside try/catch.

- [ ] **Step 1: Write the failing tests:**

```ts
test.each([
  ["hero","dev","auto","blue"], ["work","dev","auto","forest"], ["about","dev","auto","plum"],
  ["off","dev","auto","olive"], ["studio","dev","auto","blue"], ["contact","dev","auto","forest"],
  ["hero","creator","auto","white"], ["work","creator","auto","red"], ["about","creator","auto","black"],
  ["off","creator","auto","sage"], ["studio","creator","auto","teal"], ["contact","creator","auto","white"],
  ["work","dev","light","paper"], ["off","creator","light","white"],
  ["about","dev","dark","forest"], ["work","creator","dark","black"],
])("resolvePalette(%s,%s,%s) = %s", (s, m, t, want) => expect(resolvePalette(s, m, t)).toBe(want));

test("readPrefs falls back when storage throws", () => {
  vi.stubGlobal("localStorage", { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } });
  expect(readPrefs()).toEqual({ mode: "dev", theme: "auto" });
  expect(() => writePref("mode", "creator")).not.toThrow();
});
test("readPrefs ignores junk values", () => {
  vi.stubGlobal("localStorage", { getItem: (k: string) => (k === "mode" ? "admin" : "neon") });
  expect(readPrefs()).toEqual({ mode: "dev", theme: "auto" });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the four functions and `boot.js`. **Step 4: Run** → PASS.
- [ ] **Step 5: e2e** (`prefs.spec.ts`): with `localStorage` overridden to throw via `addInitScript`, the home page loads with zero console errors and `html[data-mode="dev"]`. **Step 6: Commit** `feat: add storage-safe preferences and palette resolver`.

---

### Task 4: Home page sections, mode switch, scroll palette, reveal

**Files:**
- Create: `src/components/{WorkGrid,Card,About,OffClock,Studio,Contact,Marquee}.astro`, `src/scripts/site.ts`
- Modify: `src/pages/index.astro`, `src/components/Header.astro`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `projects`, `roles`, timelines (Task 2); `resolvePalette`, `readPrefs`, `writePref`, `nextTheme` (Task 3).
- Produces: every section root carries `data-section="<Section>"`. Mode-specific markup carries `data-show="dev"` or `data-show="creator"`. `site.ts` dispatches `window` events `modechange` (`detail: Mode`) and `palettechange` (`detail: PaletteName`) after updating the DOM; the game and fluid mounts listen to these.
- Produces: `Card.astro` props `{ name: string; summary: string; tags: string[]; href?: string; primary?: { label: string; url: string }; code?: string }`. Developer cards link their title to `/work/<slug>`.

- [ ] **Step 1: Write the failing tests:**

```ts
test("Developer shows 10 cards, Creator shows 7", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-show="dev"] .card:visible')).toHaveCount(10);
  await page.getByRole("button", { name: "Creator", exact: true }).click();
  await expect(page.locator('[data-show="creator"] .card:visible')).toHaveCount(7);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creator");
});
test("palette follows the section in view, and the footer at page end", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-pal", "blue");
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator("body")).toHaveAttribute("data-pal", "plum");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator("body")).toHaveAttribute("data-pal", "forest");
});
test("theme button locks one palette", async ({ page }) => {
  await page.goto("/"); await page.locator("#theme").click();          // light
  await page.locator("#off").scrollIntoViewIfNeeded();
  await expect(page.locator("body")).toHaveAttribute("data-pal", "paper");
});
test("contact has five links in order", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#contact .cta a")).toHaveText([/LinkedIn/, /GitHub/, /YouTube/, /Instagram/, /Facebook/]);
});
test("with JavaScript off, Developer content is visible", async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto("/");
  await expect(page.locator('[data-show="dev"] .card').first()).toBeVisible();
  expect(await page.locator(".rv").first().evaluate(n => getComputedStyle(n).opacity)).toBe("1");
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Copy all visible copy from the demo (hero lines, About ledes, chips, Off-the-clock tiles, Zeedio line "My web studio in Melbourne."). Contact URLs: LinkedIn `https://www.linkedin.com/in/zadeed-haque-496528217/`, GitHub `https://github.com/zadeedhaque`, YouTube `https://www.youtube.com/@ZadeedHaque`, Instagram `https://www.instagram.com/zadzzd/`, Facebook `https://www.facebook.com/zadeed.ccaa.7`. `site.ts`: mode switch and "Creator side / Developer side" button; theme button cycling with glyph and label (◐ Auto, ☀ Light, ☾ Dark) and an updated `aria-label`; an `IntersectionObserver` with `rootMargin: "-45% 0px -45% 0px"` that sets `body[data-pal]` via `resolvePalette`, plus the page-end rule (within 80 px of the bottom, use the last section); reveal observer that adds `.in`; scroll progress bar. The reveal's hidden state applies only under `html.js`, a class `site.ts` adds. Header logo plays a short pop when the palette changes.
- [ ] **Step 4: Run** `npm run build && npm run e2e -- home` → PASS. **Step 5: Commit** `feat: build home sections with mode, theme and scroll palettes`.

---

### Task 5: Hero game

**Files:**
- Create: `src/game/font.ts`, `src/game/engine.ts`, `src/game/render.ts`, `src/game/mount.ts`, `src/components/Hero.astro`
- Test: `tests/unit/game.test.ts`, `tests/e2e/game.spec.ts`

**Interfaces:**
- Produces:

```ts
export const LEVELS: string[][]             // [["ZADEED","HAQUE"],["ADIBA"]]
export type PowerKind = "wide" | "multi" | "fire";
export interface Brick { x: number; y: number; alive: boolean; hot: boolean }
export interface Ball { x: number; y: number; vx: number; vy: number; stuck: boolean }
export interface Game {
  w: number; h: number; cell: number; level: 0 | 1; bricks: Brick[]; balls: Ball[];
  drops: { x: number; y: number; kind: PowerKind }[];
  paddle: { x: number; w: number; base: number; y: number };
  wideMs: number; fireMs: number; phase: "play" | "bonus-prompt" | "between"; phaseMs: number; broken: number; total: number;
}
export function createGame(w: number, h: number, level?: 0 | 1): Game
export function resizeGame(g: Game, w: number, h: number): void      // re-lays out bricks, keeps which are alive by index
export function stepGame(g: Game, dtMs: number, input: { targetX: number | null; left: boolean; right: boolean }, rng?: () => number): void
export function grant(g: Game, kind: PowerKind): void
export function startBonus(g: Game): void                           // from "bonus-prompt"
```
- Timings: wide 10 000 ms at 1.6× paddle width; fire 6 000 ms, balls pass through bricks; multi adds 2 balls; drop chance 0.10 per broken brick, at most 3 drops on screen; bonus prompt auto-continues after 3 200 ms; after ADIBA, 1 400 ms then back to level 0. `stepGame` sub-steps internally so no single ball move exceeds `cell / 2`.
- `mount.ts` exports `mountGame(stage: HTMLElement): void`. Auto-play until first pointer or key input in the stage; hand back to auto-play after 6 s idle. Stage has `touch-action: pan-y`, `tabindex="0"`, and an `aria-label` describing the controls. Bonus pop-up is real DOM (`role="status"`, text "Bonus Round", a "Play" button). Bricks are squares in Developer and circles in Creator; colours read from the palette variables on `palettechange`.

- [ ] **Step 1: Write the failing unit tests:**

```ts
test("name level has 190 bricks, bonus has 89", () => {
  expect(createGame(1000, 480, 0).total).toBe(190);
  expect(createGame(1000, 480, 1).total).toBe(89);
});
test("clearing the name prompts the bonus, clearing ADIBA returns to the name", () => {
  const g = createGame(1000, 480); g.bricks.forEach(b => (b.alive = false));
  stepGame(g, 16, idle); expect(g.phase).toBe("bonus-prompt");
  stepGame(g, 3300, idle); expect(g.level).toBe(1); expect(g.phase).toBe("play");
  g.bricks.forEach(b => (b.alive = false)); stepGame(g, 16, idle); stepGame(g, 1500, idle);
  expect(g.level).toBe(0);
});
test("power-ups", () => {
  const g = createGame(1000, 480);
  grant(g, "wide"); stepGame(g, 2000, idle); expect(g.paddle.w).toBeCloseTo(g.paddle.base * 1.6, 0);
  stepGame(g, 9000, idle); stepGame(g, 2000, idle); expect(g.paddle.w).toBeCloseTo(g.paddle.base, 0);
  const n = g.balls.length; grant(g, "multi"); expect(g.balls.length).toBe(n + 2);
  grant(g, "fire"); expect(g.fireMs).toBe(6000);
});
test("same outcome at 60 fps and 240 fps", () => {
  const a = createGame(1000, 480), b = createGame(1000, 480);
  for (let i = 0; i < 300; i++) stepGame(a, 1000 / 60, idle, seeded(1));
  for (let i = 0; i < 1200; i++) stepGame(b, 1000 / 240, idle, seeded(1));
  expect(Math.abs(a.balls[0].y - b.balls[0].y)).toBeLessThan(a.cell);
});
test("a 60-second frame does not tunnel or produce NaN", () => {
  const g = createGame(1000, 480); stepGame(g, 60000, idle);
  for (const b of g.balls) { expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true); expect(b.y).toBeLessThanOrEqual(g.h + 50); }
});
test("resize keeps play going", () => {
  const g = createGame(1000, 480); g.bricks[0].alive = false; resizeGame(g, 340, 420);
  expect(g.bricks[0].alive).toBe(false); expect(g.total).toBe(190);
  expect(g.bricks.every(b => b.x >= 0 && b.x + g.cell <= 340)).toBe(true);
});
test("a lost ball is served again", () => {
  const g = createGame(1000, 480); g.balls[0].stuck = false; g.balls[0].y = g.h + 100; g.balls[0].vy = 5;
  stepGame(g, 16, idle); expect(g.balls).toHaveLength(1); expect(g.balls[0].stuck).toBe(true);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `font.ts` (5×7 glyphs for Z A D E H Q U I B, copied from the demo), `engine.ts`, then `render.ts` and `mount.ts`. Port collision, layout and tuning constants from the demo; cap a frame's simulated time at 100 ms. **Step 4: Run** `npm test -- game` → PASS.
- [ ] **Step 5: e2e** (`game.spec.ts`): the stage is focusable and has an `aria-label`; pressing ArrowLeft with the stage focused moves the paddle (expose `data-paddle-x` on the stage for the test); `location.hash = "#bonus"` does **not** open the pop-up; with `reducedMotion: "reduce"` the hint reads "Tap to start" and no brick breaks within 2 s.
- [ ] **Step 6: Commit** `feat: add name-breakout hero with power-ups and bonus round`.

---

### Task 6: Fluid backgrounds

**Files:**
- Create: `src/fluid/wave.ts`, `src/fluid/gas.ts`, `src/fluid/renderer.ts`, `src/fluid/mount.ts`
- Modify: `src/layouts/Base.astro` (add the fixed `<canvas id="water" aria-hidden="true">`)
- Test: `tests/unit/fluid.test.ts`, `tests/e2e/fluid.spec.ts`

**Interfaces:**
- Produces:

```ts
export interface Field { w: number; h: number; height: Float32Array; dye: Float32Array }
export function createWave(w: number, h: number): Field & { step(): void; drop(gx: number, gy: number, radius: number, amp: number, ink: number): void }
export function createGas(w: number, h: number): Field & { step(): void; puff(gx: number, gy: number, radius: number, fx: number, fy: number, ink: number, burst: number): void }
export function gridSize(viewW: number, viewH: number, longSide: number): { w: number; h: number }   // min short side 48
export function mountFluid(canvas: HTMLCanvasElement): void
```
- Wave: 2D wave equation, damping 0.986 per step; dye diffuses with a 4-neighbour blur and fades by 0.991 per step; grid long side 256. Gas: stable-fluids (self-advection ×0.992, 14 pressure passes, buoyancy 0.03 × density, density fade 0.996); grid long side 128. Both step at a fixed 16.67 ms tick fed by `dt × 0.55`, with the accumulator capped at 50 ms.
- Renderer: one WebGL2 program, `RG16F` texture (R height, G dye/density), the demo's dot-grid fragment shader: 10 CSS px cells, square pixels for gas, round dots for water, dot radius `0.47 × sqrt(intensity)`, no dot when intensity < 0.02. Developer mode uses gas, Creator uses water; switch on `modechange`. Colours follow `palettechange`, eased.
- Input: pointer move pushes (strength scales with speed, capped); pointer down drops a ripple or puff. Listeners are passive.

- [ ] **Step 1: Write the failing unit tests:**

```ts
test("a drop disturbs the water and it settles", () => {
  const f = createWave(64, 48); f.drop(32, 24, 5, 3, 0.9);
  expect(Math.max(...f.height)).toBeGreaterThan(0.5);
  for (let i = 0; i < 2000; i++) f.step();
  expect(Math.max(...f.height.map(Math.abs))).toBeLessThan(0.01);
  expect(Math.max(...f.dye)).toBeLessThan(0.01);
});
test("gas stays finite and thins out", () => {
  const g = createGas(64, 48); g.puff(32, 30, 6, 2, 0, 1.3, 2.2);
  const start = g.dye.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 600; i++) g.step();
  expect(g.dye.every(Number.isFinite)).toBe(true);
  expect(g.dye.reduce((a, b) => a + b, 0)).toBeLessThan(start * 0.5);
});
test("smoke rises", () => {
  const g = createGas(64, 48); g.puff(32, 40, 4, 0, 0, 1.5, 0);
  for (let i = 0; i < 120; i++) g.step();
  expect(centreOfMassY(g)).toBeLessThan(40);
});
test("grid keeps the long side and a floor on the short side", () => {
  expect(gridSize(1920, 1080, 256)).toEqual({ w: 256, h: 144 });
  expect(gridSize(375, 812, 256)).toEqual({ w: 118, h: 256 });
  expect(gridSize(4000, 200, 256).h).toBe(48);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, porting from the demo. **Step 4: Run** `npm test -- fluid` → PASS.
- [ ] **Step 5: e2e** (`fluid.spec.ts`): normal context → `#water` exists and `getContext("webgl2").getError()` is 0 after a pointer move and a click; `reducedMotion: "reduce"` → `#water` is absent; with `HTMLCanvasElement.prototype.getContext` stubbed to return `null` for `"webgl2"` → `#water` is absent, zero console errors, and the mode switch still works.
- [ ] **Step 6: Commit** `feat: add dot-grid water and gas backgrounds`.

---

### Task 7: Cursor, ripple, tilt, glass logo

**Files:**
- Create: `src/scripts/cursor.ts`, `src/scripts/ripple.ts`, `src/scripts/tilt.ts`, `src/scripts/glass.ts`
- Modify: `src/components/Studio.astro`, `src/layouts/Base.astro`
- Test: `tests/e2e/interactions.spec.ts`

**Interfaces:**
- Consumes: palette variables; `Logo.astro`.
- Produces: `data-cursor="<label>"` on any element shows that label inside the cursor ring (game: "Play", glass logo: "Tap").
- Glass logo: CSS 3D slab (9 stacked slices 4.5 px apart, two sheen faces at ±20 px, logo on both sides), six looks in this order with glow colours: white tile `#f73650`, navy `#6aa9d8`, red `#ffffff`, black `#d98d57`, teal `#f73650`, sage `#e8a36f`. Idle spin 42° per second; a tap adds a spin burst that decays. A tap is a pointer up with under 8 px of travel. Enter and Space change the look; arrow keys rotate. The element has `role="button"` and an `aria-label`. Under 860 px the logo is centred in its card.
- Cursor and tilt run only when `(hover: hover) and (pointer: fine)` and motion is allowed. Ripple rings appear on every pointer down when motion is allowed. There is no full-screen colour flash.

- [ ] **Step 1: Write the failing tests:**

```ts
test("tapping the glass logo cycles six looks", async ({ page }) => {
  await page.goto("/"); const logo = page.getByRole("button", { name: /glass logo/i });
  const seen = new Set<string>();
  for (let i = 0; i < 6; i++) { seen.add(await logo.locator(".glass").evaluate(n => (n as HTMLElement).style.getPropertyValue("--glow"))); await logo.press("Enter"); }
  expect(seen.size).toBeGreaterThanOrEqual(4);          // two looks share #f73650
});
test("idle spin is about 42 degrees per second at any frame rate", async ({ page }) => {
  await page.goto("/"); await page.locator("#studio").scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
  const a = await yaw(page); await page.waitForTimeout(2000); const b = await yaw(page);
  expect((b - a) / 2).toBeGreaterThan(34); expect((b - a) / 2).toBeLessThan(50);
});
test("logo is centred on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto("/");
  const s = await box(page, "#scene"), c = await box(page, ".studio");
  expect(Math.abs((s.x + s.width / 2) - (c.x + c.width / 2))).toBeLessThan(2);
});
test("reduced motion: no custom cursor, no ripple", async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: "reduce" })).newPage(); await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/has-cursor/);
  await page.mouse.click(200, 200); await expect(page.locator(".ripple")).toHaveCount(0);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, porting from the demo. **Step 4: Run** → PASS. **Step 5: Commit** `feat: add cursor, ripples, card tilt and glass logo`.

---

### Task 8: Project pages and Academics

**Files:**
- Create: `src/components/VideoSlot.astro`, `src/pages/work/[slug].astro`, `src/pages/academics/index.astro`, `src/pages/academics/cloud-computing.astro`
- Test: `tests/e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `projects`, `study`, `scores`, `coursework`, the `case-studies` collection; `Base.astro`.
- Produces: `VideoSlot.astro` props `{ video?: string; poster?: string; title: string }`. With no `video` it renders a 16:9 dashed placeholder with `aria-label="Video demo of <title>, coming soon"`. With `video` it renders `<video controls muted playsinline preload="metadata">` and the poster.
- Project page order: title, summary, tags, "Open it" and "GitHub" buttons (only those that exist), `VideoSlot`, rendered case study, previous / next links wrapping around the list. Sections use `data-section="hero"` then `data-section="work"` so palettes, fluids and cursor behave as on the home page. Page title: `<name> · Zadeed Haque`.
- Academics page order: study timeline, score chips, four coursework cards with empty image slots. Cloud Computing page uses the project-page layout with the `cloud-computing` case study and a "Back to Academics" link.

- [ ] **Step 1: Write the failing tests:**

```ts
for (const slug of ["lava-lift","learn-salah","dhakar-rasta","physics-lab","crownfall","neon-snake","handwritten-numbers","medicare-bd","spin-and-win","60-projects"])
  test(`/work/${slug} has an empty video slot above the case study`, async ({ page }) => {
    expect((await page.goto(`/work/${slug}`))!.status()).toBe(200);
    const slot = page.getByLabel(/Video demo of .* coming soon/);
    await expect(slot).toBeVisible(); await expect(page.locator("video")).toHaveCount(0);
    expect((await slot.boundingBox())!.y).toBeLessThan((await page.locator("article h2").first().boundingBox())!.y);
    await expect(page.getByRole("link", { name: /Next/ })).toBeVisible();
  });
test("home cards link to project pages", async ({ page }) => {
  await page.goto("/"); await page.getByRole("link", { name: "Lava Lift" }).click();
  await expect(page).toHaveURL(/\/work\/lava-lift\/?$/);
});
test("academics", async ({ page }) => {
  await page.goto("/academics");
  await expect(page.getByText("CGPA 3.64 / 4.00")).toBeVisible(); await expect(page.locator(".card")).toHaveCount(4);
  await page.getByRole("link", { name: /Cloud Computing/ }).click();
  await expect(page).toHaveURL(/\/academics\/cloud-computing\/?$/);
  await expect(page.getByText("$712")).toBeVisible();
});
test("header nav reaches Academics from every page", async ({ page }) => {
  await page.goto("/work/crownfall"); await page.getByRole("link", { name: "Academics" }).click();
  await expect(page).toHaveURL(/\/academics\/?$/);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npm run build && npm run e2e -- pages` → PASS, and re-run `build-output` (the new pages must also be free of inline script and style). **Step 5: Commit** `feat: add project pages with video slots and Academics pages`.

---

### Task 9: Remove the old site, accessibility sweep, ship notes

**Files:**
- Delete: `index.html`, `work.html`, `academics.html`, `hobbies.html`, `contact.html`, `cloud-computing.html`, `css/`, `js/`, `assets/`, `source-art/`, `videos/`
- Create: `src/pages/404.astro`, `README.md`
- Move: `CNAME` to `public/CNAME`
- Test: `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the failing tests:**

```ts
for (const pal of ["blue","forest","plum","olive","paper","white","red","black","sage","teal"])
  test(`no contrast violations on the ${pal} palette`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });       // still background, measurable
    await page.goto("/"); await page.evaluate(p => { document.body.dataset.pal = p; }, pal);
    const res = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(res.violations).toEqual([]);
  });
for (const path of ["/", "/work/lava-lift", "/academics", "/academics/cloud-computing", "/404"])
  test(`axe passes on ${path}`, async ({ page }) => {
    await page.goto(path); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
test("no leftover files or images from the old site", () => {
  for (const gone of ["index.html", "work.html", "css", "js", "assets", "source-art", "videos"]) expect(existsSync(gone)).toBe(false);
  expect(filesUnder("dist").filter(f => /\.(jpe?g|png)$/i.test(f))).toEqual([]);
});
test("interactive targets are at least 44 px on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto("/");
  for (const b of await page.locator("header button, .btn").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** Delete the old files; 404 page with the header, a short line and a link home; fix whatever axe reports. `README.md`: how to run, test and add a project or a video, plus the owner's checklist: add a DMARC TXT record at Namecheap, turn on 2FA for Namecheap, GitHub and Vercel, enable domain lock, protect `main`, submit the domain to the HSTS preload list after the headers are live, send the logo as separate SVG files.
- [ ] **Step 4: Run everything.** `npm test && npm run build && npm run e2e` → all PASS.
- [ ] **Step 5: Commit** `feat: remove old static site, add 404 and accessibility checks`.
- [ ] **Step 6: Hand back.** Do not push or merge. Report the branch name and ask the owner to open a Vercel preview for `redesign` and try it on a real phone before merging.
