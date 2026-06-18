# VideoFlow

A content pipeline manager for solo video creators. Plan, track, and ship videos
across every platform from one board.

Built with React + TypeScript + Vite. All data lives in the browser
(`localStorage`) — no backend required.

## Features

- **Dashboard** — at-a-glance stats (in production, due this week, ready to
  publish, idea backlog), an "Up next" deadline list, pipeline-health bars, and a
  "Needs attention" panel for overdue / high-priority work.
- **Pipeline** — a 6-stage Kanban board (Idea → Scripting → Recording → Editing →
  Review → Publishing) with drag-and-drop between stages and per-platform filters.
- **Calendar** — monthly view of scheduled publish dates, color-coded by stage,
  with a configurable week start (Sunday or Monday).
- **Ideas** — quick capture inbox; promote any idea straight into scripting.
- **Detail drawer** — per-video workflow stepper, stage checklist, priority/format
  metadata, a Drive/Dropbox file link, and production notes.
- **New-video modal** — create a video with platform, priority, target date, and
  starting stage.
- **Mobile preview** — toggle a phone frame with a bottom nav from the top bar.
- **Theming** — switch the accent color from the settings menu.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
npm test         # run the render/interaction tests (Vitest + jsdom)
```

## Project structure

```
src/
  constants.ts          stages, platforms, priorities, formats, checklists
  types.ts              shared TypeScript types
  dates.ts              date parsing + relative "due" labels (reference date: 2026-06-18)
  seed.ts               sample video dataset
  display.ts            per-video display selectors
  store.tsx             React context store + localStorage persistence + actions
  components/
    Sidebar, Topbar, MobileNav
    Dashboard, Pipeline, Calendar, Ideas
    Drawer, NewVideoModal
    ui.tsx              Dot + Hover helpers
  App.tsx               desktop/mobile frame + view routing
  App.test.tsx          smoke + interaction tests
```

Origin: ported from the `VideoFlow` design comp into a fully functional app.
