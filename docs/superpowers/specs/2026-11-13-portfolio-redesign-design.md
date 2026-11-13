# zadeedhaque.com redesign: design spec

Date: 2026-11-13 · Status: built (2026-11-13), see README.md
Reference build: `docs/superpowers/reference/demo/index.html` (throwaway demo, approved look and feel)

## Intent

The site's one job is to showcase Zadeed and his work. Not a business site: Zeedio stays on `zeedio.zadeedhaque.com` and gets one small card.
The site should feel playable and alive, read fast (little text), and be as secure as a static site can be.

## Goals

- Hero is a game: breakout where the bricks spell ZADEED HAQUE. Works with mouse, touch and arrow keys.
- Power-ups drop from bricks: wide paddle (10 s), multi-ball (+2), fireball (6 s).
- Clearing the name shows a "Bonus Round" pop-up, then a level spelling ADIBA. Clearing that returns to the name.
- Two modes, switch labelled "Developer" / "Creator". Each swaps headline, work list, about text, timeline and palette set. Choice remembered.
- Background colour changes per section on scroll. Theme button: Auto (scroll colours), Light, Dark (one fixed calm palette). Choice remembered.
- Custom cursor (mouse only), tap/click ripple and colour flash, scroll reveals, marquee, card tilt with glare, and a spinning glass 3D logo in the Zeedio card: a clear rounded slab with the logo inside and a coloured edge glow, built in CSS 3D (stacked slices for edge thickness, two sheen faces). Tapping it (or Enter) switches to the next of the six logo colourways; dragging spins it.
- Developer mode background is gas instead of water: an incompressible fluid simulation (stable-fluids method: self-advection, 14-pass pressure solve, buoyancy) on a grid of about 128 cells on the long side. The cursor drags accent-coloured smoke that swirls, rises and thins; a tap makes an outward puff. Same canvas and shader as the water, same fallbacks.
- Creator mode background is water, on every page: a real wave simulation (2D wave equation on a grid of about 256 cells on the long side, with damping) plus a dye field that diffuses and fades. Moving the cursor pushes the water and leaves accent-coloured dye; a tap or click drops a ripple. Rendered by a small hand-written WebGL2 shader, no library. Colours follow the section palette. Off under reduced motion and where WebGL2 is missing; the plain background shows instead. Zadeed accepted the extra weight.
- Both fluid backgrounds are drawn as a dot grid, not a smooth surface: one dot per 10 px cell, sized by how disturbed the fluid is there. Gas uses square pixels, water uses round dots, matching the bricks in each mode. Still fluid shows no dots. Both simulations run at 0.55× real time.
- Glass logo idle spin: about 42° per second, frame-rate independent.
- Every project gets its own page: video demo slot at the top (left empty until Zadeed supplies videos), then the case study.
- All current images removed. Every image and video position is an empty slot for new media.

## Non-goals

- No business, pricing or quote content (that is Zeedio).
- No contact form, blog, CMS or analytics in this build.
- No demo-only helpers in production: the font picker button and the `#bonus` shortcut are removed.

## Anti-goals (failure even if it works)

- Long paragraphs on the home page.
- A heavy page: the game, cursor and glass logo stay small hand-written JS and CSS, no 3D library. (A three.js glass logo was tried and rejected by Zadeed.)
- Anything that breaks a strict Content-Security-Policy (inline scripts, third-party fonts or scripts).
- Motion that ignores `prefers-reduced-motion`.

## Constraints

- Hosting: Vercel, domain on Namecheap, repo `github.com/zadeedhaque/Portfolio`.
- Accessibility: WCAG AA contrast on every palette, visible focus, 44 px touch targets, keyboard play for the game and cube.
- Zadeed applies the account and DNS security items himself; the build must make the header items possible (see Security).

## Approaches considered

1. Plain HTML/CSS/JS (today's setup): no build step, but header, footer and project data repeated by hand on every page.
2. **Astro static site (picked).** Projects in one data file, pages generated from it, ships plain HTML plus only our own JS. Self-hosted fonts and external scripts make a strict CSP easy.
3. Next.js/React: familiar, but ships far more JS and server surface than a portfolio needs.

Picked 2: easy updates without giving up the small attack surface. Claude's recommendation; Zadeed has not objected.

## Decided design

### Type
- Headings: Space Grotesk 500/700. Body and UI: Inter 400/500/700. Self-hosted WOFF2.
- No monospace font anywhere.

### Palettes (CSS variables `--bg --surface --line --text --muted --accent --accent-text --on-accent`)
- Developer, by section: Hero and Zeedio `blue` #10254a with lime #c8f24a · Work and Contact `forest` #0f2a1e with lime · About `plum` #2a1230 with amber #ffb84a · Off the clock `olive` #1c1f14 with orange #ff7a45.
- Creator, from the logo colourways: Hero `white` · Work `red` #f73650 · About `black` · Off the clock `sage` · Zeedio `teal` · Contact `white`.
- Fixed themes: Light = `paper` (Developer) / `white` (Creator). Dark = `forest` / `black`.
- Exact values: copy from the demo file. Header logo tile switches to match the palette.

### Home page sections
Header (logo, Work, About, Academics, Contact, mode switch, theme button) → hero game, one-line pitch, two buttons → skills marquee → Work grid → About (one line, chips, short timeline) → Off the clock strip → Zeedio card with the glass logo → Contact (LinkedIn, GitHub, YouTube, Instagram, Facebook). Copy as in the demo.

### Project pages (`/work/<slug>`)
One per Developer project, 10 total: Lava Lift, Learn Salah, Dhakar Rasta, Physics Lab, Crownfall, Neon Snake, Handwritten Numbers, MediCare BD, Spin & Win, 60 Projects.
One long page:
1. Title, one-line summary, tags, "Open it" and "GitHub" buttons.
2. Video demo card, 16:9, empty placeholder until a video is added. The video path is a field in the data file; when set, the card plays it (muted, with controls and a poster slot).
3. Case study: the existing write-ups from the `work.html` modals, migrated as they are (sections such as How it works, What I built, Challenges, Key skills, Tech stack).
4. Previous / next project links.
Home cards link to these pages.

### Academics page (`/academics`)
A separate page, linked from the header nav, decided by Zadeed. Same palettes, motion and fonts as the home page.
1. Study timeline: Swinburne (CS, AI major, now – 2027), BRAC University (CSE, CGPA 3.64), Rajuk Uttara Model College (HSC, GPA 5.00), plus IELTS 7.5, SAT 1300 and the Creative IT graphic design certificate.
2. Coursework cards, each with an empty image slot: Cloud Computing Architecture, Multi-AZ VPC, Flood-Resilience Raft, Web Projects.
3. Cloud Computing Architecture keeps its full write-up (three AWS assignments, diagrams, the $712 → $389 cost cut) at `/academics/cloud-computing`, laid out like a project page: empty video card on top, then the write-up.
The home About section keeps its short timeline and links to this page.

### Logo
Six colourways from Zadeed's logo sheet. The demo crops tiles from one image; the build needs one SVG or PNG per colourway.

### Security (build side)
- `vercel.json` headers: CSP `default-src 'self'` with no `unsafe-inline` scripts, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone and geolocation, HSTS with `includeSubDomains; preload`.
- External links use `rel="noopener noreferrer"`. No secrets in the repo.
- Zadeed's side: DMARC record, 2FA on Namecheap, GitHub and Vercel, domain lock, branch protection.

## Builder's calls (Claude's, open to correction)

- Creator-mode roles stay as cards only, with no pages, because they are roles, not projects.
- Page `<title>` becomes "Zadeed Haque", not "Zeedio".
- Reduced motion: no custom cursor, no ripples, the game waits for a tap.
- The images in `assets/`, `source-art/` and `videos/` are removed from the repo when the new site ships.

## Open questions for Zadeed

1. Do Creator roles need pages later, for showreels?
2. Can you send the logo as separate files, SVG preferred? Until then the build crops the tiles from the logo sheet, as the demo does.
