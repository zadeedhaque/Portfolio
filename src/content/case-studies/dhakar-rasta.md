---
title: "Dhakar Rasta"
---

*Solo build · 3D browser game · 2026*

ঢাকার রাস্তা — *one accident, a lifetime of tears.* A 3D browser game about surviving Dhaka traffic, with road-safety awareness built into the gameplay. It is not a racing game: the goal is to drive as far as you can without a serious accident while the city does everything it can to stop you.

- **0** External models, textures or audio files — everything is procedural
- **~150** Draw calls for a full street of traffic, buildings and people
- **~170 kB** Gzipped JavaScript, plus the bundled Bangla font
- **~5,900** Lines of TypeScript across 62 modules

## The idea

Anyone who has lived in Dhaka knows the road is less a system than a negotiation. I wanted a game that captures that feeling — funny and chaotic, with a serious message underneath: every hazard is something people really do, and every crash is avoidable if you pay attention. The design rule I held myself to was that every dangerous situation must be difficult but fair.

## What it throws at you

- **Endless procedural Dhaka** — the road streams in 100 m segments (normal road, commercial area, market, foot-overbridge, bus stop, construction, traffic jam), weighted by difficulty, with rules that prevent impossible combinations such as a jam straight after a narrowed road.
- **Traffic with habits** — cars, CNGs, buses including a double-decker, trucks, pedal and battery rickshaws and motorbikes, each with its own speed, lane habits and behaviour state machine. They follow the car in front, change lanes when stuck and honk when blocked; rickshaws ring a bell instead.
- **Pedestrians** who walk the footpath, wander between stalls, cross in groups, run, or stop mid-road to check their phone.
- **Events** — wrong-way rickshaws, battery rickshaws that home in on you, bus jams, sudden stops, motorbikes cutting in from the footpath, crossing crowds.
- **A satirical economy** — dodging hazards earns money (৳); a major crash brings a traffic officer who offers a fine or an in-game "arrangement", and if you can't afford either, the run is over.

## How it stays fair

- **A fairness check before every spawn.** A hazard must appear far enough ahead to give a configurable reaction window, there must be at least one free escape lane (two early on) at the predicted meeting point, and a global hazard budget stops events from stacking.
- **Hazards that stop chasing.** Vehicles that steer toward you, like battery rickshaws, stop tracking once inside the reaction window, so a late swerve always works. Side-swipes and being rear-ended count as minor bumps, never game-ending crashes.
- **Autopilot testing.** A developer autopilot drives the car, and a mode steps the simulation frame by frame without rendering. Running it for minutes of game time at every difficulty showed which crashes were unfair — leading to changes like minor side-swipes, no lane changes from a standstill, and no crash when two bodies were already moving apart.

## Built to be light

- **One mesh per object.** Every vehicle, person, building and stall is generated as low-poly geometry and merged into a single mesh, so a whole 100 m street renders in a handful of draw calls. Contact shadows for every moving object are one instanced draw call.
- **Pooling and streaming.** Vehicles, pedestrians, particles and UI pop-ups are object-pooled; road segments stream in ahead and are disposed behind the player.
- **Simulation separate from rendering.** The game logic runs in a simple 2D road space (lateral position and distance along the road). The AI never touches meshes — the renderer reads the simulation each frame — which kept it easy to reason about and made automated testing possible. About 0.08 ms per frame of simulation.
- **One source of truth.** One state machine controls game flow (menu, playing, paused, crash, police, game over); all tuning values live in one config file and all user-facing text in one Bangla strings file.

## Bangla, all the way down

- **Bangla text in 3D.** Shop signs and banners are drawn onto canvas textures with a bundled Noto Sans Bengali font, so conjuncts and vowel marks render correctly and the game works fully offline.
- **Fully Bangla UI** with Bangla numerals, a glass-style HUD, hazard warning markers and reward toasts such as "অল্পের জন্য!" for a near miss.
- **All sound synthesised in the browser** — engine, horn, rickshaw bells, bus air brakes, crowd murmur, coin, crash and police whistle. No audio files.

## The launch video

A 23-second launch video made from the real game engine: each shot is scripted and rendered frame by frame, with Bangla kinetic typography, rickshaw-art colour wipes, and an original score in the D Bhairav scale (dhol, tabla, harmonium) with every sound effect tuned to the same key.

## What's next

- Real low-poly 3D models — the asset system is built so models can be swapped in without touching game logic.
- Testing and polishing the touch controls on real phones.
- Day/night and monsoon-rain variations, and shareable score cards.

## Key skills

Game architecture · Procedural generation · AI behaviour · Performance · Web Audio · Localisation (Bangla) · Automated testing

## Tech stack

TypeScript · Three.js · Vite · Web Audio API · Noto Sans Bengali · Vercel
