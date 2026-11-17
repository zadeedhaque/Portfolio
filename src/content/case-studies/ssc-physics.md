---
title: "Zadeed's SSC Physics Lab"
---

*Solo build · Interactive education · 2026*

The SSC companion to the HSC Physics Lab: a lightweight, Bangla-first web app for Class 9–10 Physics in Bangladesh. Concept notes, live simulations, a formula sheet with calculators, a step-by-step numerical solver, MCQ and creative-question practice, virtual practicals and an exam mode — with no login, no backend and no AI API.

- **31** Live simulations, in 3D and 2D
- **61** Topics, each with the textbook definition and a plain-language version
- **91** MCQs with explanations, plus 14 creative questions
- **~220** Automated tests, including a headless run of every simulation

## The learning path is the design

**Learn → Visualize → Experiment → Calculate → Practice → Master.** Each chapter walks a student through that order: read the idea, watch it happen, change the variables, work the numbers, then test themselves.

## Bangla first, English beside it

The whole interface is in Bangla by default, with the English term next to every important word (গতি · Motion), following NCTB terminology. One click switches everything to English.

## What is inside

- **Simulations.** Measurement and units, motion and free fall, Newton's laws, collisions and friction, work and energy, waves, sound and echo, mirrors and ray diagrams, charges, electric fields and induction. Every one has live readouts, equations with live substitution, graphs and a Learn panel.
- **Formula sheet.** 47 formulas by chapter, rendered with KaTeX, each with a "Try it" calculator and unit choosers.
- **Numerical solver.** Say what you want to find and what you know; it picks the formula, rearranges it, converts to SI, substitutes and explains every step.
- **Practice and exam mode.** MCQ, creative questions in the ক / খ / গ / ঘ structure, and full 75-mark practice tests with a timer, chapter performance and recommended revision.
- **Practical lab.** 13 virtual experiments with observation tables and CSV export.

## Built to the SSC 2026 syllabus

Only the seven chapters on the SSC 2026 exam syllabus are included and labelled. The syllabus is data-driven, so a future chapter is one metadata row plus its content. Practice questions are written for the project and labelled as practice, not official board questions.

## Key skills

- Three.js used directly, with one scene at a time and full cleanup on unmount
- A small canvas chart driven by each simulation's own state, so graphs never drift from the physics
- Bilingual content model with every user-visible string checked for both languages
- Offline support through a small service worker; fonts and KaTeX ship with the app

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Three.js · KaTeX · React Router · Vitest
