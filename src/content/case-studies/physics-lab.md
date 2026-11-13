---
title: "Zadeed's Physics Lab"
---

*Solo build · Interactive education · 2026*

An interactive 3D laboratory covering the entire Bangladesh HSC Physics syllabus — 153 topics across both papers, where every slider changes real physics and every number on screen comes from the equations rather than a lookup table.

- **153** Syllabus topics, both papers, organised as students meet them
- **115** 3D simulations, each built for its own topic
- **308** Automated tests, run before every deploy
- **2** Languages — English and বাংলা

## The brief: make the physics visible, not just the formulas

HSC Physics in Bangladesh is two dense papers — 21 chapters running from vernier callipers to nuclear fission, semiconductors and the H–R diagram. Most students meet these ideas as static textbook diagrams and formulas to memorise. The goal was a single place where they could change the variables and watch the laws respond, and the brief set a high bar for honesty:

- **Every parameter must visibly affect the physics.** No decorative sliders, no dead buttons, no placeholder pages dressed up as finished.
- **Every number must be computed** from the real equations, in SI units, and never show NaN or Infinity — even at the slider extremes.
- **Cover the whole syllabus**, organised exactly as students meet it: paper → chapter → topic.
- **Work on a phone**, because that is the device most students actually have.

## Anatomy of a simulation

- **Syllabus** Both papers, every chapter and topic, plus favourites and recents
- **3D scene** Three.js, with labelled vectors and measurements you can orbit, pan and zoom
- **Parameters** Sliders with units and one-tap presets, in a tinted high-contrast card
- **Live graphs** Driven by the simulation state, not canned curves

Below the scene each page also carries Results, Equations with live substitution, a Learn panel, and an optional Experiment mode that records measurements to a table and exports CSV. Playback runs play, pause, single-step, restart and slow motion down to 0.1×. Behind that shared layout each simulation is built for its own topic: rigid bodies and orbits, wave fields rendered in shaders, particle gases, circuit solvers, ray optics and Monte-Carlo nuclear physics.

## Physics as pure functions, simulations as modules

The codebase separates **what is true** from **what is drawn**. Formulas live in a small library of pure TypeScript functions — kinematics, gravitation, optics, circuits, nuclear physics — each unit-tested on its own. Every simulation is one self-contained module that declares its parameters, presets, graphs and Learn content, and gets registered automatically just by existing in the folder.

- **The controller owns time.** Physics advances in fixed sub-steps of 1/240 s regardless of frame rate, renders once per frame, pauses automatically when a run finishes, and handles slow motion — so the same simulation behaves identically on a 60 Hz phone and a 144 Hz monitor.
- **Modules are lazy-loaded**, so opening one page downloads only that module — at most about 4.5 kB compressed.
- **Adding a topic means adding a file.** A module is small and declarative: params, presets, graphs, learn content, and a create function returning step, render, setParams, reset, readouts and equations.

## Keeping it honest — 308 tests

“No NaN, no dead sliders” is easy to promise and hard to keep across 115 simulations, so it is enforced by tests rather than by hand. One suite runs every module through its defaults, every preset, the minimum and maximum of every slider, six random parameter sets and every dropdown option. For each it steps the physics, presses every button, clicks every clickable 3D object, sweeps each parameter and resets — then asserts that no readout, equation or graph point is NaN, Infinity or undefined. The suite also checks that every syllabus entry points at a real module, that labels are unique, that every Bangla translation is complete, and that every formula survives the fraction formatter unchanged. It runs on every push, and the site only deploys if it passes.

**What is checked**Tests

**Physics formula library (unit tests)**44

**Simulation modules, each under a dozen or more parameter sets**118

**Bangla content complete for every simulation**116

**Formula-to-fraction parser (edge cases)**30

**Total, run before every deploy**308

**Bugs it caught along the way:** a heap overflow when a ruler tried to draw ticks for a zero-length track; a charged particle circling the wrong way; a prism ray rotated the wrong direction; Lenz's-law poles reversed; interference nodal lines offset by half a wavelength; a readout of “Infinity” after a Doppler source passed the listener; and a duplicate label that broke React's rendering of the fission panel.

## Details that matter to students

- **Formulas that read like the textbook.** Equations are written once as plain text, so they stay easy to author and search. A small parser then works out every numerator and denominator and draws them stacked, including nested fractions, and recognises compound units such as m/s² or T·m/A and leaves them inline — exactly as a textbook prints them. Each formula also appears with the student's current values substituted in, so the jump from symbol to number is always visible.
- **Controls you can find at a glance.** In early versions the sliders blended into the rest of the panel. The Parameters card now has its own tinted background, a solid accent edge and high-contrast bold labels, so it reads as “the part you touch” in both themes, with presets on top as one-tap starting points.

## A 3D lab that doesn't fight your thumb

On a touchscreen, a 3D view that eats every swipe makes the page impossible to scroll. So on phones and tablets the camera starts **locked**: swipes scroll the page, and one tap on *Locked* hands control back to the 3D scene. The page header, controls and graphs stack into a single column. On a laptop the syllabus sidebar can be tucked away for a wider stage, and the choice is remembered between visits.

## Learn it in English or বাংলা

Every simulation's Learn panel has an English | বাংলা switch, and the Bangla versions cover all 115 simulations — the concept, the meaning of every variable, what to observe and the experiment challenge — using the terms from Bangladesh's HSC textbooks, such as লঘিষ্ঠ গণন (least count), আবেগ (momentum) and কার্যাপেক্ষক (work function). Symbols and formulas stay as printed in the textbooks, so a student can move between languages without re-learning notation. The Bangla text loads only when someone picks বাংলা (41 kB compressed), and a test fails if any simulation is missing a translation.

## From neon to trustworthy

The visual identity went through several quick rounds, each shipped live and judged on real pages rather than mock-ups: a clean dark interface in sky blue built to get every simulation working; a “flashy” round of neon pink, violet and cyan with glowing gradients and a sci-fi display face; a type pass that dropped that face as gimmicky and settled on Exo 2 from a side-by-side of five candidates; and finally a professional redesign — navy and slate with a single calm blue, Source Serif 4 headings and Inter body text, with gradients, glows and animated headings removed so the physics carries the colour. Colours *inside* the simulations were deliberately left out of every redesign: red for positive charge, blue for negative, amber for current and so on carry physical meaning and stay consistent across all 115 scenes. Both light and dark themes are fully designed, and follow the device setting by default.

## Fast to load, safe to update

The app is a static site with no server. Every push to main runs the type check and all 308 tests in GitHub Actions and, only if they pass, publishes to GitHub Pages. A Vercel configuration is included for teams who prefer it, with rewrites so any simulation link opens directly.

**Bundle**SizeGzipped

**Three.js (3D engine)**627 kB158 kB*Once, then cached*

**App shell, navigation, panels**399 kB126 kB*Once, then cached*

**One simulation module**3–10 kB1.5–4.5 kB*Only when that page opens*

**Bangla Learn content**199 kB41 kB*Only if বাংলা is chosen*

**Styles**35 kB8 kB*Once*

## Where it stands

- **Complete syllabus coverage** — all 153 HSC topics across both papers open a working simulation, from 115 modules, with some topics sharing a module in a different starting configuration (the horizontal projectile is the projectile simulation launched at 0°).
- **About 23,000 lines of TypeScript**, with physics, rendering and content kept apart so each can change safely.
- **Live and continuously deployed**, with a test gate in front of every release.
- **Next:** a Bangla-speaking physics teacher to review the translations before classroom use; Bangla extended from the Learn panel to menus, slider labels and results; offline support for classrooms without reliable internet; and a classroom mode for teachers to project one simulation and share a preset link.

## Key skills

Simulation design · Numerical methods · 3D graphics · GLSL shaders · Test architecture · Internationalisation · Information architecture · Mobile UX · CI/CD

## Tech stack

React · TypeScript · Three.js · Vite · Tailwind CSS · Vitest · GitHub Actions · GitHub Pages · Vercel
