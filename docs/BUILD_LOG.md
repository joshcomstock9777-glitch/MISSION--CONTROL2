# Build Log

## 2026-09-06 — escapeHtml real fix + COMPLETE on create

**Shipped**
- Fixed `escapeHtml`: previous replace targets were no-ops (same character). Now uses proper `&`, `<`, `>`, `"`.
- New-mission status select includes **COMPLETE**.
- Build stamp `2026-09-06-j`. Cache-bust on app.js / operator-extra.js.
- Files: `public/app.js`, `public/index.html`, `docs/BUILD_LOG.md`.
- No Brain write. No secrets. No Amber/Allie merge. ART / CD-001 parked.

**Next**
- Josh must redeploy Fly (`fly deploy`) — live box still serves older assets until then.
- Optional Fly volume if `data/state.json` should survive machine replace.

**Blocker for Josh**
- Fly redeploy. This builder cannot publish the machine.
- Optional Fly volume.
- Real SMS/text not available from this builder session.

---

## 2026-09-06 — Mobile polish (Android) + Reset filters

**Shipped**
- Header **Reset filters** button clears all operator filters and localStorage `mc.filters.v1`.
- Fixed broken `escapeHtml` entity encoding.
- Android-focused CSS: 40px touch targets on status/presence buttons, 16px inputs (no zoom), overflow-x hidden, meta-actions row.
- Build stamp `2026-09-06-i`. Cache-bust on app.js / operator-extra.js.
- Files: `public/app.js`, `public/index.html`, `public/styles.css`.
- No Brain write. No secrets. No Amber/Allie merge. ART / CD-001 parked.

**Next**
- Josh must redeploy Fly (`fly deploy`) — live box still serves older assets until then.
- Optional Fly volume if `data/state.json` should survive machine replace.

**Blocker for Josh**
- Fly redeploy. This builder cannot publish the machine.
- Optional Fly volume.
- Real SMS/text not available from this builder session.

---

## 2026-09-06 — Filter persistence (localStorage)

**Shipped**
- Operator filters (crew presence, mission status, mission owner, systems status, activity type) now persist in `localStorage` key `mc.filters.v1`.
- Survives full page reload on Android; still holds across live refresh.
- Build stamp `2026-09-06-h`. Cache-bust on app.js / operator-extra.js.
- Files: `public/app.js`, `public/index.html`.
- No Brain write. No secrets. No Amber/Allie merge. ART / CD-001 parked.

**Next**
- Josh must redeploy Fly (`fly deploy`) — live box is still serving older JS until then.
- Fly volume if `data/state.json` should survive machine replace.

**Blocker for Josh**
- Fly redeploy. This builder cannot publish the machine.
- Optional Fly volume.
- Real SMS/text not available from this builder session.

---

## 2026-09-06 — Systems filter + board pulse

**Shipped**
- Systems panel status filter (All / Ok / Unverified / Unknown / Recovery / 404).
- Header pulse: online crew, active missions, blocked, systems hot.
- LIVE / DOWN health chip + build stamp `2026-09-06-g`.
- Cache-bust query on app.js / operator-extra.js.
- Files: `public/index.html`, `public/app.js`, `public/styles.css`.
- No Brain write. No secrets. No Amber/Allie merge. ART / CD-001 parked.

**Next**
- Josh must redeploy Fly (`fly deploy`) — live box is still serving older JS.
- Fly volume if `data/state.json` should survive machine replace.

**Blocker for Josh**
- Fly redeploy. This builder cannot publish the machine.
- Optional Fly volume.
- Real SMS/text not available from this builder session.

---

## 2026-09-06 — Mission owner filter

**Shipped**
- Missions panel: Owner filter (All + crew/mission owners). Combines with status filter.
- Client-side on cached missions; holds across live refresh.
- Files: `public/index.html`, `public/app.js`.
- No Brain write. No secrets. No Amber/Allie merge. ART / CD-001 still parked.

**Next**
- Fly volume if Josh wants `data/state.json` to survive machine replace.
- Optional: systems status filter or mobile tightening.
- ART / CD-001 stays parked until Josh says go.

**Blocker for Josh**
- Optional: attach a Fly volume for persistent operator state.
- Real SMS/text not available from this builder session.

---

## 2026-09-06 — Crew presence filter (round table parked)

**Shipped**
- Crew panel filter: All / Online / Standby / Offline.
- Client-side on cached crew; presence PATCH still works; filter holds across live refresh.
- Files: `public/index.html`, `public/app.js`.
- Round table left as-is. No Brain write. No secrets. No Amber/Allie merge. ART / CD-001 still parked.

**Next**
- Mission owner filter.
- Fly volume if Josh wants `data/state.json` to survive machine replace.
- ART / CD-001 stays parked until Josh says go.

**Blocker for Josh**
- Optional: attach a Fly volume for persistent operator state.
- Real SMS/text not available from this builder session.

---

## 2026-09-06 — Verification pass (background, Josh away)

**Shipped**
- Re-read full tree + key files. A–F backlog confirmed complete and wired.
- Seed + static brain use **Tigra**. No Amber/Allie merge. No secrets.

**Next**
- Operator road work (filters, persistence). Round table parked.
- ART / CD-001 stays parked until Josh says go.

**Blocker for Josh**
- Fly volume for persistent state if wanted.
- Real SMS/text not available from this builder session.
