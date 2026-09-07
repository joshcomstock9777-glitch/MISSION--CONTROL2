# Mission Control Build Log

## 2026-09-07 — Roundtable attention board wired

**Shipped**
- Roundtable panel now live: fetches `/api/roundtable` on load + every refresh cycle.
- Shows counts (blocked / review / active / Josh / offline), talk-next list, blocked missions, ready-for-review, Josh decision handoffs, offline crew, systems needing verify.
- Manual Refresh button on the panel; full-width on mobile/tablet for scan-first use.
- Build stamp `2026-09-07-g`. Files: `public/app.js`, `public/styles.css`.

**Next**
- Optional: paste-to-handoff from copied Brain MD.
- Public host (Render/Fly) still needs Josh account connection.

**Blocker for Josh**
- Deploy click on Render (or Fly) — repo is deploy-ready; no public URL until host is connected.

## 2026-09-07 — Copy Brain MD helper

**Shipped**
- Brain Snapshot page: "Copy Brain MD" button builds a clean Markdown summary (source, core rule, roster table, assignments table, notes) from the live `/api/brain-snapshot` payload and copies it to clipboard (with Android WebView fallback).
- Read-only only — does not write STUDIO_BRAIN.md or any sister system.
- Build stamp path unchanged; one-file change: `public/brain.html`.

**Next**
- Public host (Render/Fly) still needs Josh account connection.
- Optional: paste-to-handoff from copied MD, or tighter mobile spacing tweaks if Josh reports friction.

**Blocker for Josh**
- Deploy click on Render (or Fly) — repo is deploy-ready; no public URL until host is connected.

## 2026-09-07 — Dashboard restore (A–F surface)

**Shipped**
- Restored empty `public/index.html`, `public/styles.css`, and truncated `public/app.js`.
- Working operator dashboard with:
  - Crew presence buttons (ONLINE / STANDBY / OFFLINE) → PATCH `/api/crew/:id`
  - Mission status cycle buttons (ASSIGNED → ACTIVE → READY FOR REVIEW → COMPLETE + BLOCKED) → PATCH `/api/missions/:id`
  - Activity log panel from `/api/events` with type filters
  - Handoff form → POST `/api/handoffs` (Brain template fields)
  - Systems status buttons, sister-repo board (via operator-extra.js)
  - Live refresh every 30s, sticky header, mobile-first layout (Android-friendly touch targets, safe-area, filter chips)
- Brain snapshot page (`/brain.html`) already present; left intact.

**Next**
- Public host (Render/Fly) still needs Josh account connection.
- Optional: owner filter on missions, Copy Brain MD helper if still desired beyond current handoff form.

**Blocker for Josh**
- Deploy click on Render (or Fly) — repo is deploy-ready; no public URL until host is connected.

## 2026-09-07 — Mission owner filter

**Shipped**
- Dynamic owner filter chips under Missions panel (built from live mission owners).
- Status filter + owner filter combine (AND).
- Mobile-friendly chip row; build stamp `2026-09-07-f`.

**Next**
- Optional: Copy Brain MD helper on handoff / brain page.
- Public host still needs Josh (Render/Fly connect).

**Blocker for Josh**
- Deploy click on Render or Fly — no public URL until host is connected.
