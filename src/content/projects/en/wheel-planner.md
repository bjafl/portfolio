---
title: wheel-planner
summary: An interactive årshjul (annual wheel) planner – activities and milestones are dragged and resized directly on a radial timeline. React, SVG, a pure geometry module and a small Express/SQLite API.
period:
  start: "2026-09"
status: prototype
context: personal
areas: [frontend, backend]
stack: [React 19, TypeScript, Vite, Zustand, Tailwind CSS, shadcn/ui, Floating UI, SVG, d3-shape, date-fns, "@use-gesture/react", "@dnd-kit", Express 5, SQLite, better-sqlite3, pnpm workspaces, just, Vitest, Testing Library, Supertest]
featured: true
order: 7
repo: https://github.com/bjafl/wheel-planner
draft: false
---

## Background

An årshjul (annual wheel) is a radial timeline of one calendar year: months on the outer ring and activities as arcs on
rings further in. I wanted to see how far I could take direct manipulation as the main interaction – you should be able
to grab an activity on the wheel itself and drag it, not just fill in a form.

The design spec in the repo records an explicit choice of direct manipulation over a safer, form-first first version,
with a deliberately simple backend.

## What I built

- **The wheel.** SVG rendering of a month ring, a marker for today and one ring per category. Activities are drawn as
  arcs and milestones as point markers.
- **Drag to edit.** Move a whole activity, drag the handle at either end to change its start or end, or move a
  milestone. Dates show in a tooltip as you drag.
- **Recurring activities.** Daily, weekly, monthly or yearly rules with an interval and an optional end date, expanded
  into occurrences for the chosen year.
- **Lane packing.** Activities that overlap in the same ring are placed in separate lanes automatically.
- **Rings.** Add, remove and reorder category rings by dragging them in a list in the side panel.
- **Side panel** with a form and list for creating, editing and deleting activities and milestones. Also zoom and pan on
  the canvas, empty states and error messages when the API fails. The UI text is in Norwegian.

**Status and limits.** This is a working single-user prototype, and the README says so plainly: there is no UI yet for
creating or choosing a wheel – the app creates one wheel per browser (for 2026) on first run and remembers its id in
`localStorage`. There is no login, no multi-user support, no multi-year view, no export and no undo/redo. All of these
are explicitly out of scope in the design spec.

## Architecture

![Architecture sketch: an SVG wheel with zoom, pan and drag, and a side panel with forms and a ring list, read from and write to a Zustand store. The store repacks lanes and saves every change to an Express 5 REST API for wheels, rings and activities, which stores data in SQLite through better-sqlite3. The geometry/ module of pure functions for date↔angle, lane packing and recurrence is used by the wheel and the store.](../../../assets/projects/wheel-planner/architecture.svg)

The key decision is `geometry/`: pure functions with no React or DOM for date↔angle, lane packing and recurrence
expansion. Components only handle pointer input, and all date maths goes through the same functions, which makes the
subtle parts easy to test in isolation. Dragging uses local preview state while you drag and commits to the store only
on release. Lanes are computed on the client, stored in the database and recomputed when an activity changes.

## Tech

React 19, TypeScript and Vite, with Zustand for state, Tailwind CSS 4 and shadcn/ui. The wheel is hand-written SVG with
`d3-shape` and `date-fns`; `@use-gesture/react` handles drag, zoom and pan, `@dnd-kit` the ring order and Floating UI the
tooltips. The API is Express 5 with `better-sqlite3` and plain SQL. It is a monorepo with pnpm workspaces and just
recipes. There are 58 test cases in 15 files (Vitest, Testing Library and Supertest) covering geometry, the store, the API
and key components. The feel of dragging itself is not covered by automated browser tests; the spec says it is verified manually.

## What I learned

- **Separating geometry from rendering.** Keeping date↔angle, lane packing and recurrence in pure functions is what made
  the rest manageable. Mistakes there are subtle and hard to spot visually.
- **Dates are harder than they look.** The code has a dedicated conversion function because `toISOString()` can shift a
  date by a day in time zones ahead of UTC and across daylight-saving changes.
- **Direct manipulation has a cost.** Local state while dragging, snapping to whole days and a recurring series stored as
  one row (where dragging moves the whole series) were choices I had to make for it to feel right.
- **Scoping is a feature.** The README and spec are clear about what the prototype is not.
