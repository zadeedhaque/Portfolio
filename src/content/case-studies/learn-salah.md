---
title: "Learn Salah"
---

*Solo build · Interactive 3D web app · 2026*

Don't just read how to pray. See it. Learn it. Practice it. Learn Salah teaches the Islamic prayer through a 3D figure instead of text alone: as you scroll through a lesson the figure moves into each position — takbir, bowing, prostration, sitting — while the camera, highlights, instructions, Arabic text, transliteration and meaning stay in sync beside it.

- **0** 3D model files — the figure is generated entirely in code
- **5** Daily prayers, taught rak'ah by rak'ah
- **4** Sunni schools of law compared side by side
- **3** Languages: English, বাংলা and العربية, with full right-to-left layout

**Status:** the religious content is a draft awaiting scholar review, and audio recitations haven't been added yet. The site says so itself.

## The 3D engine

- **A figure with no model files.** The centerpiece is a faceless human figure generated entirely in code: a full skeleton with articulated hands and feet, a draped robe with folds, and a kufi cap. It loads instantly because there is nothing to download.
- **Each position defined once.** The figure is placed with inverse kinematics so contact points are exact — forehead and palms flat on the floor in prostration, hands on the knees when bowing.
- **One animation system.** It moves the figure smoothly between positions and passes through realistic in-between postures, for example standing, then kneeling, then prostrating. The descent order even follows the selected madhhab (knees first or hands first).
- **A camera that directs itself.** A dedicated camera system picks the clearest angle for each step automatically; users can switch to front, side or three-quarter views, or rotate freely.

## The learning experience

- **Scroll-driven lessons.** As each step reaches the reading line, the figure, camera, body-part highlights, recitation and timeline update together. Each step answers three questions: what am I doing, how exactly do I position myself, and what do I say.
- **For complete beginners** there is an onboarding path covering wudu, qiblah and prayer times, followed by lessons for each of the five daily prayers.
- **Practice mode** quizzes you on what comes next, alongside a recitation library and a quick-reference view.
- **Madhhabs side by side.** The four schools are compared without ranking one over another, and choosing one changes the figure's posture where they differ.

## Content and accuracy

- **Content as data.** All religious content is stored as structured data, separate from the interface, so a scholar can review it without touching the code.
- **Labelled and sourced.** Each step labels its rulings by category (fard, wajib, sunnah, recommended) per school and cites its sources: Qur'an references, hadith with standard numbering, and a standard reference text for each school.

## Accessibility and reach

- **Three languages** — English, Bengali and Arabic — with a mirrored layout for Arabic and native numerals.
- **Built for everyone:** keyboard navigation and shortcuts, screen-reader announcements, reduced motion, high contrast and larger text.
- **A 2D fallback.** If 3D isn't available on a device, the app falls back to 2D illustrations generated from the same pose data.
- **No account needed.** Progress is saved on the device, and it runs on desktop and mobile.

## Key skills

Inverse kinematics · Procedural 3D · Scroll-driven animation · Internationalisation & RTL · Accessibility · Content modelling

## Tech stack

React 19 · TypeScript · Vite · Three.js · React Three Fiber · Drei · Tailwind CSS 4 · Motion · Zustand · Vercel · GitHub Pages
