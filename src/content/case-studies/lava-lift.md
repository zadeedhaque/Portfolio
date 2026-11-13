---
title: "Lava Lift"
---

*Solo build · Browser game · 2026*

Save them before it's too late. A volcano is erupting and the lava keeps rising. In Lava Lift you fly a rescue helicopter, pick up stranded survivors and carry them to a safe camp on a mountain top before the lava reaches them. It runs in the browser on phones and desktops.

- **0** Image or audio files — all art, sound and music are generated in code
- **6** Physics bodies per survivor, joined by constraints into a ragdoll
- **5** Zones in one large level, from town to mountain camp
- **3** Ways to fly: touch joystick and lift lever, mouse, or keyboard

## The core idea: a physical human chain

Rescued survivors don't just disappear into the helicopter. They hang below it in a chain, each one holding the ankles of the person above. Every survivor is a six-part ragdoll joined by physics constraints, so the chain swings, stretches and reacts to every turn, stop and gust of wind. The more people you carry, the heavier and harder the helicopter is to fly — and if you fly too roughly, the chain snaps.

## What it throws at you

- **A helicopter with weight.** Momentum, banking, wind, fuel and hull damage — and every survivor on the chain makes it heavier.
- **Physical pickups.** Hover close and slowly, or the survivor misses the grab.
- **A world that gets worse.** Rising lava, falling volcanic bombs, and eruptions that speed up over time.
- **One large level** through a town, a ruined city, a forest and an industrial zone to the mountain camp, with survivors on rooftops, trapped in rubble, running, in groups and on cliffs.
- **Made for phones too** — a touch joystick and lift lever, plus mouse and keyboard, with settings and best times saved in the browser.

## How it's built

- **Everything generated in code.** Parallax backgrounds, the helicopter, the survivors, particles, lighting and screen shake are drawn on an HTML5 canvas, and all sound and music are synthesised with the Web Audio API — there are no image or audio files.
- **Matter.js for the ragdolls,** with custom collision code to keep the rest of the world fast.
- **Adaptive quality.** Graphics quality drops automatically if the frame rate falls, so it stays playable on weaker phones.
- **A state machine** runs the menu, tutorial, gameplay, pause and results screens.
- **Levels as data.** Levels are data files, so new ones are easy to add.

## Key skills

Physics simulation · Ragdolls & constraints · Procedural art · Procedural audio · Game feel · Performance tuning

## Tech stack

JavaScript · HTML5 Canvas · Matter.js · Web Audio API · Vite · Vercel
