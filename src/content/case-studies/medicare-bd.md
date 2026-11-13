---
title: "MediCare BD"
---

*Solo project · Full-stack web app · 2026*

A HotDoc-style healthcare platform built for Bangladesh's multi-hospital system. I designed and built the whole thing myself — data model, authentication, business logic and four role-based dashboards.

- **4** User roles, each with its own dashboard
- **19** Database tables in the Prisma schema
- **8** Appointment states, from confirmed to completed
- **0** Double bookings — slots are locked in a transaction

## Who does what

- **Platform admin** — approves, rejects or suspends hospitals, resolves complaints, and tracks growth on an analytics dashboard.
- **Hospital admin** — applies to join, manages departments, approves or adds doctors, and sets schedules.
- **Doctor** — registers with a BMDC number, sets weekly availability, marks patients waiting or no-show, and writes diagnoses, prescriptions and reports.
- **Patient** — searches by specialty and division/district, books a slot, cancels or reschedules, and views prescriptions, records and payments.

## What I built

- Designed a 19-table relational schema in Prisma covering hospitals, departments, doctors, schedules, slots, appointments, consultations, prescriptions, payments, reviews, complaints, notifications and an audit log.
- Built email/password authentication with bcrypt hashing and a signed JWT session in an httpOnly cookie, plus role guards that route each user to their own dashboard.
- Wrote booking, cancelling and rescheduling as database transactions, so a slot is re-checked and locked at the moment of booking — no double bookings.
- Generated bookable time slots automatically from each doctor's weekly schedule, 21 days ahead.
- Added a two-step approval flow (platform → hospital → doctor) with rejection reasons, suspension and reactivation.
- Implemented in-app notifications, an audit log of key actions, and an admin analytics dashboard with Recharts.
- Localised it for Bangladesh: all 8 divisions and districts, BMDC registration, fees in taka, and bKash / Nagad / Rocket payment options.
- Wrote a seed script with realistic demo hospitals, doctors, patients and appointments.

## How it flows

## Key skills

Full-stack development · Database design · Authentication · Role-based access · Transactions · Dashboard UI · System design

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma · SQLite · Tailwind CSS 4 · Zod · bcrypt · jose (JWT) · Recharts · date-fns · Lucide
