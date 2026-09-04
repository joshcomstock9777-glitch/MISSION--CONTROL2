# Mission Control Build Log

## 2026-08-31 — Crew presence check-in

**Shipped**
- Dashboard crew rows now have ONLINE / STANDBY / OFFLINE chip buttons.
- Each button PATCHes `/api/crew/:id` with `{ presence }` (endpoint already existed).
- Active presence highlighted; UI reloads state after change.

**Next**
- B. Mission status cycle buttons (ASSIGNED → ACTIVE → READY FOR REVIEW → COMPLETE, plus BLOCKED).

**Blocker**
- None. Josh approval not required for this slice.

## 2026-08-31 — Mission status cycle buttons

**Shipped**
- Mission rows now have status chips: ASSIGNED, ACTIVE, READY FOR REVIEW, COMPLETE, BLOCKED.
- Each chip PATCHes `/api/missions/:id` with `{ status }` (endpoint already existed).
- Active status highlighted via existing tone classes; UI reloads after change.

**Next**
- C. Activity log panel: append events when missions/crew change; persist in data/state via API /api/events.

**Blocker**
- None.

## 2026-08-31 — Activity log panel

**Shipped**
- `events` array on state (seeded empty); capped at 100 newest.
- Server appends events on mission create/update and crew presence/status PATCH.
- `GET /api/events` and `POST /api/events` for read/manual note.
- Dashboard Activity panel (full-width) lists recent events with time, type, message, actor.

**Next**
- D. Read-only Brain snapshot page that fetches and displays a summary of studio-behind-the-cast/STUDIO_BRAIN.md (no rewrite of the Brain).

**Blocker**
- None.

## 2026-08-31 — Brain snapshot page

**Shipped**
- `GET /api/brain-snapshot` returns a structured, read-only summary (roster, assignments, core rule, notes).
- `public/brain.html` operator page; link from dashboard header.
- No live GitHub fetch (Brain repo is private; no tokens stored). Snapshot curated from verified Brain content only.
- Does not write or replace STUDIO_BRAIN.md.

**Next**
- E. Handoff form matching the Brain handoff template; save into data/handoffs.json via API.

**Blocker**
- None. Live auto-refresh of Brain would need a Josh-approved read path (no secrets in this repo).

## 2026-08-31 — Handoff form (Brain template)

**Shipped**
- `GET/POST /api/handoffs` — persists to `data/handoffs.json` (capped 200).
- Dashboard Handoff panel: form fields match Brain template (name, assignment ID, status, completed, evidence, tools, verified, remains, blockers, next action, Josh decision YES/NO + note).
- Recent handoffs list; each save also logs an activity event.
- Does **not** write or append to STUDIO_BRAIN.md (canonical Brain stays separate).

**Next**
- F. Mobile polish for the dashboard (Josh is on Android).

**Blocker**
- None. Promoting a handoff into the Brain still requires a Josh-approved write path / human paste.

## 2026-08-31 — Mobile polish (Android)

**Shipped**
- Safe-area insets (notch / gesture bar), `100dvh`, theme-color + mobile-web-app meta.
- Touch targets ≥44px on chips, inputs, buttons, checkbox.
- Inputs at 16px to avoid mobile zoom-on-focus.
- Phone layout: single column, stacked crew/mission rows, flex-wrap chips, handoff form single-column.
- Tap highlight suppressed; `-webkit-overflow-scrolling: touch` on activity lists.
- Same treatment on `brain.html`.

**Next**
- Backlog A–F complete. Await Josh for new priorities (e.g. live Brain read path, publish gates, deploy target).

**Blocker**
- None for this slice. Any deploy / external account change still needs Josh.

## 2026-09-03 — Deploy-ready (Josh approved publish)

**Shipped**
- `GET /health` and `GET /api/health`.
- Server binds `0.0.0.0` so containers/hosts can reach it.
- `Dockerfile`, `Procfile`, `render.yaml`, `docs/DEPLOY.md`.
- No secrets added. No sister repo replaced.

**Next**
- Josh: connect this repo to Render (Blueprint) to mint the public Android URL. One click on his account.

**Blocker**
- No host API is connected here. Cannot invent a live URL. GitHub Pages cannot run the Node API.

## 2026-09-04 — Round table briefing

**Shipped**
- `GET /api/roundtable` rolls up blocked missions, ready-for-review, Josh-decision handoffs, offline crew, systems needing verify.
- Dashboard Round table panel at top of the board.
- Read-only compute. Does not write STUDIO_BRAIN.md. Amber and Allie stay separate rows.

**Next**
- Public host still needs Josh Render Blueprint click.
- Crew can use the panel as the agenda for the room.

**Blocker**
- Same deploy blocker. No invented URL.
