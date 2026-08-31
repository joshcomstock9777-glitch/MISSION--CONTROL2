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
