---
title: "Neon Snake"
---

*Solo build · 3D browser game · September 2026*

Snake, rendered in real 3D and built entirely from code: the arena is a shader, the snake is instanced geometry, the music is synthesised while you play. 6,276 lines of TypeScript and CSS across 46 files, 380 kB gzipped, deployed automatically to GitHub Pages.

- **0** Asset files — every texture, sound and icon is generated at runtime
- **~198 fps** Measured at 1000 × 620, about 3× the 60 fps target
- **6,276** Lines of TypeScript, TSX and CSS across 46 files
- **380 kB** Gzipped bundle, no game engine

## How it holds its frame rate

- **React never touches the game.** The rules live in plain TypeScript running on a fixed clock, and send out events (ate, levelled up, died) that the graphics, sound and interface each listen to. The renderer smooths between ticks, so movement looks fluid on any screen while the rules tick at a steady rate.
- **Nothing that changes every frame lives in React.** Screen shake, arena colour and ripple timings would re-render the page 120 times a second; they sit in plain objects the render loop reads directly.
- **Nothing is created mid-game.** Particles come from a fixed pool that overwrites its oldest entries, the snake is two instanced meshes rather than one object per segment, and scratch values are reused — so a long session allocates nothing after startup.

## Built by hand

- **Shaders** — the floor grid stays exactly one pixel wide at any distance, glows near the snake's head, throws an expanding ring on each pickup and turns red on death. The walls are a second shader that fades upward with a travelling pulse.
- **The snake** — two instanced meshes (a solid core and an additive halo), so extra length costs nothing to draw. Its colour blends through HSL rather than RGB, because a straight cyan-to-magenta blend passes through a washed-out grey. Turning banks the head on a damped spring.
- **Particles** — a fixed-capacity pool over typed arrays, drawn in one instanced mesh for every burst, trail and explosion.
- **Camera** — works out the distance that frames the whole board for the current screen shape, so it fits everything from ultrawide to phone portrait with no per-size tweaking. It orbits behind the menus and shakes on impact, decaying quickly.
- **Audio** — oscillators, envelopes and filters assembled per sound, a reverb built from generated noise, and a generative score scheduled against the audio clock so the beat never drifts when the browser is busy.

## Gameplay systems

- **Three orb types** — Energy (+10, permanent), Power (+25, 14 s) and Rare (+50, 8.5 s, from level 2). Timed orbs blink faster as they fade and move if you miss them.
- **Combos** — chaining pickups within 4.2 seconds builds a multiplier up to ×5.
- **12 levels** — every 180 points speeds the snake up (168 ms down to 62 ms per step) and shifts the arena's colour.
- **Forgiving input** — two turns are buffered, so a fast flick round a corner registers both, and turning back into your own neck is ignored. On touch, one swipe can chain turns, with an optional thumb D-pad.
- **A 17 × 17 grid** — smaller than the usual 21 × 21, because the camera frames the whole board either way and the bigger cells read much better on a phone.
- **An attract-mode demo** behind the menu plays itself: a greedy chaser that floods ahead before each move and refuses any direction that would trap it. Its score, sound and game-over are switched off so it can't touch the player's records.

## Bugs testing caught

- **Clicks silently ignored** after starting a game — an invisible full-screen overlay never unmounted. A second, identical-looking bug had a different cause: an exit animation on a blur filter never finished.
- **Neon looked washed out** — the renderer applies film-style tone mapping by default, which drains exactly the saturated colours the art depends on. Diagnosing it needed a known-bright test object and a screenshot with no overlay, because a menu scrim was also dimming the scene.
- **Blank canvas after several reloads** — the graphics context leaked, since loading a page never unmounts React. Released on page hide.
- **The snake vanished at higher levels** — snake and arena took their colours from the same palette, so by level 4 the snake was camouflaged exactly when the game got hard. The snake now keeps a fixed palette.
- **Small ones** — the game-over panel opened scrolled past its own heading, panels wouldn't scroll on touch, and the final length could read two segments short.

## Shipping it

- **Three quality tiers** set resolution, particle budget and effects. The first visit picks one from the device, so a phone never opens on high, and switching tiers rebuilds the effects without dropping the canvas.
- **Graceful failure** — if 3D isn't available, or the graphics context is lost mid-run, the player gets an explanation in the game's own style with steps to try, not a black rectangle.
- **Automatic deploys** — every push builds and publishes to GitHub Pages, and a type error fails the build instead of shipping a broken site.

## Key skills

Real-time graphics · GLSL shaders · Game architecture · Performance profiling · Web Audio · Debugging · CI/CD

## Tech stack

React 19 · TypeScript · Three.js · React Three Fiber · Zustand · Framer Motion · GLSL · Web Audio API · Vite 7 · GitHub Actions
