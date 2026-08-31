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
