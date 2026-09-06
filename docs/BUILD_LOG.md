# Build Log

## 2026-09-05 — Live Brain snapshot fetch

**Shipped**
- `/api/brain-snapshot` now attempts a live read of public raw `STUDIO_BRAIN.md` (4s timeout).
- Parses roster + assignment tables; sets `live: true` on success.
- On timeout/error/bad body → static snapshot + `fetchError` + `live: false` (brain.html already shows LIVE/FALLBACK).
- No Brain write. No secrets. One file: `server.mjs`.

**Next**
- Deploy: Josh connect Render/Fly (public URL not live).
- ART / CD-001 stays parked until operator pass is live and Josh says go.

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).
- Real SMS/text not available from this builder session.

---

## 2026-09-05 — Brain snapshot roster refresh

**Shipped**
- Restored `server.mjs` after a bad empty push during an attempted live-fetch experiment.
- Static `brainSnapshot()` updated to match current Brain: **Tigra** spelling, Slick/Artisa role strings, **BRAIN-002** READY FOR REVIEW.
- `brain.html` stamp can show LIVE/FALLBACK when `live`/`fetchError` fields are present (ready for a future live-fetch slice).
- A–F backlog remains complete. No Brain write. No deploy.

**Next**
- Optional: true live fetch of raw STUDIO_BRAIN.md (payload size limited this run).
- Deploy: Josh connect Render/Fly (public URL not live).
- ART / CD-001 stays parked until operator pass is live and Josh says go.

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).
- Real SMS/text not available from this builder session.

---

## 2026-09-05 — Sweep event filter

**Shipped**
- Activity panel type filter: added **Sweep** option.
- `eventTypeMatch` treats `sweep` and `sweep.*` (crew/mission/system/sister-repo/handoff board lines) as filterable.

**Next**
- Deploy: Josh connect Render/Fly (public URL not live).
- ART / CD-001 stays parked until operator pass is live and Josh says go.

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).
- Real SMS/text not available from this builder session.

---

## 2026-09-05 — Sister-repo buttons + front-to-back sweep

**Shipped**
- Sister repos now PATCH `/api/sister-repos/:name` from the dashboard (ACTIVE / UNVERIFIED / POC / NOT SOURCE OF TRUTH).
- Front-to-back sweep button on Round table → POST `/api/sweep`.
- Sweep writes one activity comment per board (crew → missions → systems → sister repos → handoffs) plus a summary event. Does not write the Brain. Does not start Artisa / CD-001.

**Next**
- Deploy: Josh connect Render/Fly.
- ART / CD-001 stays parked until this operator pass is live and Josh says go. No SMS connector on this account — ping stays in-chat.

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).
- Real SMS/text not available from this builder session.

---

## 2026-09-05 — Event type filter

**Shipped**
- Activity panel: type filter (All / Note / Mission / Crew / System / Handoff / Sister repo).
- Client-side filter on cached events; works with live refresh.

**Next**
- Deploy: connect this repo to Render/Fly (Josh click required — public URL not live).

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).

---

## 2026-09-05 — System status buttons

**Shipped**
- Systems panel: status cycle buttons (ACTIVE / OK / UNVERIFIED / UNKNOWN / RECOVERY / 404) → PATCH `/api/systems/:id`.
- Events logged on system update (existing pushEvent path).
- Mobile layout for system-row + system-btns (full-width touch targets).

**Next**
- Deploy: connect this repo to Render/Fly (Josh click required — public URL not live).
- Optional: event type filters on activity panel.

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).

---

## 2026-09-05 — Operator UI polish (live refresh, filter, Brain MD)

**Shipped**
- Live dashboard refresh every 30s (silent).
- Mission status filter (All / Assigned / Active / Review / Complete / Blocked).
- Copy Brain MD button on handoff form — clipboard Markdown matching Brain handoff template (does not write STUDIO_BRAIN.md).

**Next**
- Deploy: connect this repo to Render/Fly (Josh click required — public URL not live).
- Optional later: system status PATCH from UI, event type filters.

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).

---

## 2026-09-05 — Operator UI restore (A–F)

**Shipped**
- Restored `public/app.js` (was placeholder / broken).
- Restored `public/styles.css` with dark theme + Android-friendly mobile polish (touch targets, safe-area, sticky header, responsive grid).
- Crew presence buttons: ONLINE / STANDBY / OFFLINE → PATCH `/api/crew/:id`.
- Mission status cycle buttons: ASSIGNED → ACTIVE → READY FOR REVIEW → COMPLETE + BLOCKED → PATCH `/api/missions/:id`.
- Activity log panel wired to state events + note POST `/api/events`.
- Handoff form → POST `/api/handoffs` (already in HTML; now functional).
- Round table, systems, sister repos, Brain snapshot page remain as before.

**Next**
- Deploy: connect this repo to Render/Fly (Josh click required — public URL not live).
- Optional: live refresh interval, filter missions by status, copy-Brain-MD helper on handoff.

**Blocker for Josh**
- Hosting account link (Render blueprint `render.yaml` is ready).
