# Caira

**A content pipeline manager for video creators and teams.** Plan, track, and ship
videos across every platform from one board — solo, or with collaborators in real
time, with a Google Drive folder spun up for every piece of work.

🔗 **Live app:** https://videoflow-sigma.vercel.app

---

## What Caira is

Caira turns the messy, multi-tool process of making videos into a single board.
Every video moves through a clear production pipeline (Idea → Scripting → Recording
→ Editing → Review → Publishing), with deadlines, checklists, assignees, comments,
and an auto-created Drive folder attached to each one. It works as a **personal
tool offline** and as a **shared workspace** for a team — the same app, scaling up
as you need it.

## What it does

### Planning & tracking
- **Dashboard** — at-a-glance stats (in production, due this week, ready to publish,
  idea backlog), an "Up next" deadline list, pipeline-health bars, a "Needs
  attention" panel for overdue / high-priority work, and an "Incomplete checklists"
  list of work-in-progress.
- **Pipeline** — a 6-stage Kanban board with drag-and-drop between stages and
  per-platform filters.
- **Calendar** — monthly view of scheduled posting dates, color-coded by stage,
  with a configurable week start (Sunday or Monday).
- **Ideas** — a quick-capture inbox; promote any idea straight into scripting.
- **Detail drawer** — per-video workflow stepper, stage checklist, priority/format,
  editable posting date, production notes, the Drive folder link, comments, and
  delete.
- **New-video modal** — create a video with platform, priority, target date, and
  starting stage.
- **Mobile preview** + **accent theming** (brand purple by default).

### Collaboration (cloud)
- **Accounts** — email/password or magic-link sign-in; data syncs to the cloud and
  across every device.
- **Workspaces** — create multiple workspaces and switch between them.
- **Invites** — invite teammates by email (existing users join instantly; new ones
  auto-join on signup; optional real invite emails).
- **Assignees + My Tasks** — assign videos to members; each person gets a filtered
  "My Tasks" view.
- **Realtime** — every change (drag, edit, checklist, date, delete) appears live for
  everyone in the workspace, no refresh.
- **Comments** — per-video discussion, live.

### Google Drive integration
- **Auto folders** — creating any card/idea creates a Google Drive folder named
  `Title — YYYY-MM-DD` in the workspace owner's Drive (under a `Caira — <workspace>`
  parent).
- **Link sharing** — folders are set to "anyone with the link," and the link is
  saved onto the card's **Files** field automatically.
- **Manual button** — a "+ Create Drive folder" button on any card that doesn't have
  one yet.
- Owner connects Google Drive once from workspace settings; it's automatic after
  that.

## How it runs (local vs cloud)

Caira has two modes, decided automatically:

| Mode | When | Data |
|---|---|---|
| **Local** | No Supabase keys / not signed in / the offline file | Browser `localStorage`, seeded with sample videos |
| **Cloud** | Signed in on the hosted app | Supabase (Postgres) per workspace, realtime, collaboration |

There's also a **standalone build** (`Caira.html`) that is always local-only and
works fully offline — no login, no backend.

## Tech stack

- **Frontend:** React + TypeScript + Vite, inline-styled components, React Context store.
- **Backend:** Supabase (Postgres + Auth + Realtime + Row-Level Security).
- **Serverless functions** (Vercel, in `api/`): email invites, Google Drive OAuth
  callback, and Drive folder creation/sharing.
- **Hosting:** Vercel (auto-deploys from the `main` branch on GitHub).
- **Tests:** Vitest + jsdom (render + interaction smoke tests).

## Scripts

```bash
npm install            # install dependencies
npm run dev            # dev server (http://localhost:5173)
npm run build          # type-check + production build to dist/
npm run build:standalone  # local-only single-file build -> dist-standalone/index.html
npm run preview        # preview the production build
npm test               # run the Vitest + jsdom tests
```

## Project structure

```
api/                       Vercel serverless functions
  invite.ts                send real invite emails
  drive-callback.ts        Google OAuth code exchange (stores refresh token)
  drive-folder.ts          create the Drive folder + set link sharing
src/
  constants.ts             stages, platforms, priorities, formats, checklists
  types.ts                 shared TypeScript types
  dates.ts                 date parsing + relative "due" labels (reference: 2026-06-18)
  seed.ts                  sample video dataset (local mode)
  display.ts               per-video display selectors
  store.tsx                Context store: local + cloud modes, persistence, actions
  auth.tsx                 Supabase auth provider
  lib/
    supabase.ts            Supabase client (null until configured)
    videosApi.ts           cloud video CRUD + realtime subscription
    workspacesApi.ts       workspaces, members, invites
    driveApi.ts            Google Drive connect + folder sync (client side)
  components/
    Sidebar, Topbar, MobileNav, Logo
    Dashboard, Pipeline, Calendar, Ideas, MyTasks
    Drawer, NewVideoModal, CommentsSection
    WorkspaceBar, WorkspaceModal, AuthScreen, ImportBanner
    ui.tsx                 Dot / Hover / Avatar helpers
  App.tsx                  auth gate + desktop/mobile frame + view routing
  App.test.tsx             smoke + interaction tests
supabase/
  schema.sql               base schema + row-level security (run once)
  stage2.sql               profiles.email + invite RPC
  stage6.sql               Google Drive tables + videos.drive_folder_id
SUPABASE_SETUP.md          one-time backend setup guide
```

## Setup (cloud features)

1. Create a Supabase project; run `supabase/schema.sql`, then `stage2.sql`, then
   `stage6.sql` in the SQL editor. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
2. Set env vars (locally in `.env.local`, and on Vercel for production):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — public client keys.
   - `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` — server (functions) only.
   - `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` —
     for the Google Drive integration.
3. Google Drive: a Google Cloud OAuth client (Web) with redirect URI
   `https://<your-app>/api/drive-callback`, the Drive API enabled, and the
   `drive.file` scope.

## Roadmap

- **Activity feed** — a per-video audit log ("moved to Editing", "assigned to Sam").
- **Reliable invite emails** — custom SMTP (e.g. Resend) so invites never hit
  Supabase's rate limit.
- **Google sign-in** as a first-class login option.
- Possible: list view, subtasks, due-date reminders, custom domain.

---

*Origin: started from the `VideoFlow` design comp, rebranded to Caira, and grown
into a real-time collaborative product with a Supabase backend and Google Drive
integration.*
