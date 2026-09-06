# Build Log

## 2026-09-05 — Live Brain snapshot fetch

**Shipped**
- `/api/brain-snapshot` now tries a live read of `studio-behind-the-cast/STUDIO_BRAIN.md` via public raw GitHub (8s timeout).
- Parses Verified Team Roster + Active Assignment Queue tables into the snapshot.
- Fallback static snapshot (with Tigra spelling + BRAIN-002) if fetch fails.
- `brain.html` shows LIVE or FALLBACK on the stamp. Still read-only; does not write the Brain.

**Next**
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
