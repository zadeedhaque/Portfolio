# zadeedhaque.com

Zadeed Haque's portfolio. A static [Astro](https://astro.build) site: plain HTML plus a small amount of hand-written TypeScript. No UI framework, no 3D library, no third-party scripts or fonts.

- **Hero game**: breakout where the bricks spell the name, with power-ups and a bonus round.
- **Two modes**: Developer and Creator swap the headline, work list, about text and palettes.
- **Scroll palettes**: the colours follow the section in view. The theme button locks one Light or Dark palette.
- **Fluid background**: gas (Developer) or water (Creator), drawn as a dot grid with WebGL2.
- **A page per project** at `/work/<slug>`, and Academics at `/academics`.

Design spec, build plan and the approved reference demo are in `docs/superpowers/`.

## Run it

Needs Node 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

The dev server prints its address (normally http://localhost:4321).

## Test it

```bash
npm test
```

Unit tests (Vitest) for the game engine, the fluid simulations, the palette resolver and the data files.

```bash
npm run build
```

```bash
npm run e2e
```

End-to-end tests (Playwright) run against the built site in `dist/`, so build first. They cover every page, the mode and theme switches, the game, the fluid canvas, accessibility (axe) on every palette, and that the built HTML has no inline scripts or styles. The first run needs the test browser: `npx playwright install chromium`.

## Where things are

| Path | What |
| --- | --- |
| `src/data/projects.ts` | The 10 Developer projects |
| `src/data/roles.ts` | The 7 Creator roles |
| `src/data/academics.ts` | Timelines, scores and coursework |
| `src/content/case-studies/*.md` | One write-up per project, plus `cloud-computing.md` |
| `src/styles/tokens.css` | The ten palettes and the type tokens |
| `src/lib/palette.ts` | Which palette each section uses in each mode and theme |
| `src/game/` | Game rules (`engine.ts`, no DOM), drawing (`render.ts`) and input (`mount.ts`) |
| `src/fluid/` | Water (`wave.ts`) and gas (`gas.ts`) simulations, WebGL renderer, mount |
| `src/scripts/` | Mode and theme switches, cursor, ripple, card tilt, glass logo |
| `vercel.json` | Security headers, build settings, redirects from the old `.html` URLs |

## Add a project

1. Add an entry to `projects` in `src/data/projects.ts`. The `slug` becomes the URL: `/work/<slug>`.
2. Add `src/content/case-studies/<slug>.md` with a `title` in the front matter. Use `##` for section headings.
3. Run `npm test`. It fails if a project has no case study file.

Links to other sites inside a case study must be written as HTML so they open safely:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>
```

The end-to-end tests fail on an external link without that `rel`.

## Add a video

1. Put the file in `public/media/`, for example `public/media/lava-lift.mp4`. Keep it small (H.264 MP4, 1080p or less).
2. In `src/data/projects.ts`, set `video: "/media/lava-lift.mp4"` on the project. Optionally set `poster` to a still image, also under `public/`.
3. Update the "no project ships a video yet" test in `tests/unit/data.test.ts` and the video-slot test in `tests/e2e/pages.spec.ts`, which currently expect every slot to be empty.

Videos and posters must be served from this site. The Content-Security-Policy blocks media from other origins.

## Rules the build keeps

- No inline `<script>`, no inline `style=""` attributes, no third-party origins. Setting styles from JavaScript is fine.
- All motion is time-based, so it runs at the same speed on 60 Hz and 240 Hz screens.
- `prefers-reduced-motion`: no custom cursor, no ripples, no fluid canvas, no reveal animation, no auto-spin, and the game waits for a tap.
- No demo-only helpers in production (the font picker and the `#bonus` shortcut).
- Fonts are self-hosted: Space Grotesk for headings, Inter for everything else.

## Deploying

Vercel builds `main` with `npm run build` and serves `dist/`. `vercel.json` sets the framework, the headers and the redirects, so the project needs no dashboard settings.

## Owner's checklist

These need account access, so the build cannot do them:

- [ ] Add a DMARC TXT record for the domain at Namecheap.
- [ ] Turn on two-factor authentication for Namecheap, GitHub and Vercel.
- [ ] Enable domain lock at Namecheap.
- [ ] Protect the `main` branch on GitHub.
- [ ] After the headers are live, submit the domain to the HSTS preload list (hstspreload.org). Check first that every subdomain, including `zeedio.zadeedhaque.com`, serves HTTPS: the header covers subdomains.
- [ ] Send the logo as separate SVG files, one per colourway. Until then each tile is cropped from `public/logo-sheet.webp`.
- [ ] Supply the project demo videos and card images. Every image and video position is an empty slot.
