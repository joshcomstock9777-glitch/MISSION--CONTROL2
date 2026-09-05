# Build Log

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
