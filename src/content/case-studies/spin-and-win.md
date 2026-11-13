---
title: "Spin & Win"
---

*Solo build · Promotional web app · 2026*

A prize wheel for an in-store promotion, built from scratch in React and TypeScript. Staff run it on a screen at the counter and players use only the keyboard: space to spin, then a name to claim what they win.

- **4** Screens driven by one state machine
- **18,000** Simulated spins, zero landing misses
- **0.093** Max points of drift across 500,000 odds draws
- **55 kB** Gzipped — no libraries beyond React

## How it works

- **Honest odds** — one weight per prize drives both the slice angle and the chance of winning it, so what a player sees is what they get.
- **A planned spin** — the app picks the winning prize first, works out the rotation that parks that slice under the pointer, then adds 5–8 whole turns for drama. It never spins blindly and hopes.
- **One spin per player** — unless the wheel lands on Try Again, which grants another.
- **Keyboard-only flow** — every keypress is checked against the current screen, so nothing can be triggered out of turn.
- **Staff shortcuts** — six hidden key combinations force the next spin's prize; the $100 and $50 prizes can't be won any other way.

## What I built

- Wrote the wheel, confetti, particles, weighted randomness and all the geometry myself — React is the only runtime dependency.
- Built a state machine across four screens that validates every keypress against the current phase.
- Added npm run verify, a script that re-checks the promises against the real code: 18,000 simulated spins with zero landing misses, and 500,000 draws matching the configured odds within 0.093 points.
- Gave the top prize its own jackpot screen, and a claim step that puts the winner's name on the prize before staff hand it over.
- Kept a Previous records table in the browser so staff can see the day's spins and clear them.
- Made the wheel drift slowly while idle and hand that motion straight into the spin, with the background darkening and the wheel pushing forward mid-spin.
- Balanced the prize table — 30/20/20/10/10 on discounts, 5/3/2 on vouchers — and placed the client's logo in the hub and at the top of the screen.

## Bugs testing caught

- **The stuck wheel** — the result timer ran inside the browser's animation loop, which pauses in background tabs. A player who switched tabs mid-spin came back to a wheel that never finished.
- **The hidden badge** — hub badges were painted over by the next slice, half-covering the $50 label.
- **The clipped footer** — the wheel was sized from the window height instead of the space actually left, and at 1024px the centred logo collided with the player chips.

## Key skills

React · TypeScript · State machines · SVG geometry · Probability & weighting · Animation · Testing & verification

## Tech stack

React 18 · TypeScript · Vite · SVG · CSS animation · localStorage · Node verify script
