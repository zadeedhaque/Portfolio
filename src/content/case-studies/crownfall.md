---
title: "Crownfall"
---

*Solo build · 2D parkour platformer · September 2026*

A side-scrolling parkour platformer that runs in a browser tab. You play Rashan, the last heir of a house that no longer exists, crossing the fortress that outlived it. There is nothing to fight — the whole game is traversal, and the movement controller is the product rather than a supporting system.

- **0** Asset files — every tile, sprite, sound and glyph is drawn or synthesised at boot
- **28 kB** Game code gzipped, on top of the Phaser chunk
- **12** Moves in the controller, from ledge grab to wall jump
- **3** Hand-designed levels across 37 source files

## A game made only of movement

Removing combat removes the usual source of difficulty, so every ounce of interest has to come from how the character moves. That set three rules for the whole build.

- **Movement is physical, not floaty.** Acceleration, deceleration and momentum are simulated. Running is roughly twice walking speed, and several gaps cannot be cleared from a standing start.
- **The level is the opponent.** Difficulty comes from geometry and timing: crumbling stone, a shaft that can only be climbed by kicking off alternate walls, a lip you can only reach by catching it with your hands.
- **Failure is cheap.** Falling costs the climb back, nothing else. Lit braziers act as checkpoints, so a hard section can be retried immediately.

## No asset files

The game ships zero images and zero audio. Every pixel and every sound is drawn or synthesised into memory during a four-step boot, which is why the game code is 28 kB gzipped and starts instantly.

**Tile sets**16 tiles at 16 px, drawn per palette with seeded noise so stone is never flat

**Character**45 frames posed from a skeletal rig — hip, shoulder, head, two arms, two legs

**Parallax**Three layers: sky gradient, mountain and dome skyline, palace arcade

**UI font**Hand-authored 5 × 7 bitmap glyphs, baked into a texture as a Phaser RetroFont

**Sound**Web Audio oscillators and noise bursts for every effect

**Music**A generative piece in a double-harmonic mode, scheduled a bar ahead

The character is the part worth explaining. Rather than hand-placing pixels, each frame is a pose: joint angles for both arms and both legs, a torso lean and a hip offset. A walk and a run are tables of eight such poses, and everything else — hanging, climbing, vaulting, wall-sliding — is authored the same way. Changing how a jump looks means editing two numbers. Three palettes carry the mood: warm morning sandstone, cold dusk ruins, and a night fortress lit by torches. The practical payoff is that the art is a variable, not a dependency — every generator writes to a fixed texture key and skips a key that already exists, so hand-drawn PNGs can be loaded over the top later without touching game logic.

## The movement controller

A state machine over twelve moves — idle, walk, run, jump, fall, crouch, land, vault, step-up, ledge grab, ledge climb, wall slide and wall jump. All tuning lives in one file, so feel is edited in one place.

- **The controller never asks physics where the walls are.** Arcade physics resolves collisions, but every sensor query — is there a lip beside my hands, is there a wall to slide on, is that block low enough to vault — runs against a flat collision grid the level builder produces. Asking physics bodies gives answers that flicker with sub-pixel overlap; asking a grid gives the same answer every frame. Ledge detection went from the flakiest part of the game to the most dependable in one refactor.
- **A ledge grab scans a band, not a row.** It looks down the tile column beside the player's hands for a lip within a 19 px reach, then requires four things at once: the hand row is empty, the row below is solid, two rows above are clear to climb into, and the hanging body is not inside stone. Scanning a band means a fast fall cannot skip past a valid ledge between two frames.
- **Vault or step up, depending on speed.** Run at a one-tile block and Rashan vaults it with an animation; walk into it and he just steps up. That took three attempts, and it is what stops stairs feeling like walls without losing the flourish that makes a run look continuous.

## The forgiveness layer

**Coyote time — 0.10 s**A jump still registers just after walking off an edge

**Jump buffer — 0.13 s**Pressing jump slightly early still fires on landing

**Variable height — ×0.42**Tapping hops, holding clears the gap

**Turn boost — ×1.9 accel**Reversing direction bites instead of sliding

**Wall stick — 0.09 s**A wall jump lands even if you left the wall a frame ago

## Levels as code — and a tool that proves they work

Levels are functions against a builder API rather than ASCII maps or a Tiled export, so a level file reads as a list of intentions:

`**b.ground**(0, 26, 29);`*walkable floor at row 26, 29 tiles wide*

`**b.plat**(86, 17, 3);`*one-way platform you can drop through*

`**b.ledge**(96, 14, 12, 4, T.ROOF);`*floating slab, 12 wide and 4 thick*

`**b.mover**(75, 44, 82, 44, 34);`*platform that slides between two points*

`**b.faller**(45, 62);`*slab that crumbles under you*

`**b.checkpoint**(41, 61);`*lights a brazier you respawn at*

`**b.door**(161, 20);`*the way out of the chapter*

Every distance stays explicit and reviewable, and the builder is the one place to enforce invariants — it refuses to let decorative tiles overwrite collision geometry, which killed a whole bug class where dressing a wall with columns punched holes in the floor beneath.

Each level is designed against a jump budget derived from the physics rather than guessed: 2.2 tiles up from standing, 4 tiles across from a run on level ground, 3 tiles across when landing three rows up (caught as a ledge grab), four rows up not possible at all, and about two tiles of height per kick in a 48 px wall-jump shaft.

A budget on paper still lets you ship an impossible jump, and I did: a run of crumbling slabs ended four rows below the ledge it led to. No skill clears that, and it took a player reaching 32 deaths before it surfaced. The fix was a tool, not a patch. `npm run audit` turns each level into a graph of standing positions and walks it from the spawn using the real budget — ledge grabs, platform rides and wall-jump chimneys included. It fails the build if the exit or any checkpoint cannot be reached, and lists footing whose only way onward is a drop.

**PASS**level1Courtyard of Dawn*168 × 34*

**PASS**level2The Broken Span*100 × 76*

**PASS**level3Fortress of Ashes*194 × 64*

Run against the broken layout it fails outright: exit unreachable, three checkpoints stranded. A design mistake that took a human 32 attempts to find now takes 200 ms.

## Three bugs worth writing down

- **The engine recycled my sprite sheets.** Character frames were drawn into a Phaser canvas texture, then re-registered as a sprite sheet — and came back blank. Phaser returns a removed canvas texture to a shared pool and resizes it to 1 × 1 on the way, so the pixels were gone before the sprite sheet read them. Fix: own the canvas element outright and hand it to the texture manager once. *When a framework offers to manage a resource, find out what it does when you hand it back.*
- **Particles at NaN, checkpoints that never lit.** Landing dust, running dust and every checkpoint were silently dead, from one property: Arcade physics bodies expose **center** as a vector, not **centerX**. Reading the wrong one returned undefined, arithmetic produced NaN, and particles emitted at a coordinate that does not exist while proximity checks never passed. No error, no warning. *NaN fails silently in a render loop; features that quietly do nothing deserve suspicion before features that crash.*
- **Moving platforms travelled at double speed.** Platforms are positioned by hand each frame, then Arcade's post-update took the same delta and applied it again — so platforms moved twice while riders got one delta's worth and slid off the back. Two fixes: turn off the body's own motion, and nudge riders on the body rather than the sprite, because sprite coordinates during a scene update are still last frame's. *With an engine that syncs state in phases, know which phase you are standing in before you write to anything.*

The pattern across all three: the failure was never in the code I was looking at. It was in an assumption about what the framework did when I was not watching.

## Results

- **60 fps** Target held on integrated graphics at 480 × 270 internal, scaled to fit
- **86 kB** Game code raw, 28 kB gzipped; Phaser split into its own cached chunk
- **~3 s** Production build, deployed to GitHub Pages on every push to main
- **45** Character frames, posed from a rig, with six pooled particle emitters

The things that hold the frame rate are unglamorous: one culled tilemap layer instead of thousands of sprites, pooled emitters, ambient motes and torch sparks throttled and round-robined over only the torches on screen, and parallax as three tiling quads rather than large images. Next up: gamepad and touch input (the controller is already input-agnostic), a ghost replay per level since best times are stored anyway, and hand-drawn sprites over the generated ones — which the fixed texture keys were designed to allow.

## Key skills

Game architecture · Character controllers · Procedural art · Level design · Tooling · Performance · Web Audio · Debugging

## Tech stack

JavaScript · Phaser 3 · Vite · Arcade Physics · Canvas 2D · Web Audio API · GitHub Pages
