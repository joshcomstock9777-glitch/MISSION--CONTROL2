const $ = (id) => document.getElementById(id);

const PRESENCE = ["ONLINE", "STANDBY", "OFFLINE"];
const MISSION_STATUSES = ["ASSIGNED", "ACTIVE", "READY FOR REVIEW", "COMPLETE", "BLOCKED"];
const SYSTEM_STATUSES = ["ACTIVE", "OK", "UNVERIFIED", "UNKNOWN", "RECOVERY", "404"];
const REFRESH_MS = 30000;
let lastMissions = [];
let lastEvents = [];
let lastCrew = [];
let lastSystems = [];
let missionFilter = "ALL";
let missionOwnerFilter = "ALL";
let eventFilter = "ALL";
let crewFilter = "ALL";
let systemFilter = "ALL";
const BUILD = "2026-09-07-b";
let refreshTimer = null;
const FILTER_KEY = "mc.filters.v1";
function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return;
    const f = JSON.parse(raw);
    if (f.missionFilter) missionFilter = f.missionFilter;
    if (f.missionOwnerFilter) missionOwnerFilter = f.missionOwnerFilter;
    if (f.eventFilter) eventFilter = f.eventFilter;
    if (f.crewFilter) crewFilter = f.crewFilter;
    if (f.systemFilter) systemFilter = f.systemFilter;
  } catch (_) {}
}
function saveFilters() {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify({ missionFilter, missionOwnerFilter, eventFilter, crewFilter, systemFilter }));
  } catch (_) {}
}
function resetFilters() {
  missionFilter = "ALL";
  missionOwnerFilter = "ALL";
  eventFilter = "ALL";
  crewFilter = "ALL";
  systemFilter = "ALL";
  saveFilters();
  applyFilterSelects();
  renderCrew(lastCrew);
  renderMissions(lastMissions);
  renderSystems(lastSystems);
  renderEvents(lastEvents);
}
function applyFilterSelects() {
  const map = [["mission-filter", missionFilter],["mission-owner-filter", missionOwnerFilter],["event-filter", eventFilter],["crew-filter", crewFilter],["system-filter", systemFilter]];
  for (const [id, val] of map) {
    const el = $(id);
    if (el && val) {
      const ok = [...el.options].some((o) => o.value === val);
      if (ok) el.value = val;
    }
  }
}
function pill(text) {
  const v = String(text || "").toUpperCase();
  let t = "cyan";
  if (/(COMPLETE|VERIFIED|ACTIVE|ONLINE|OK|PERSISTENT)/.test(v) && !/UNVERIFIED|NOT |PENDING/.test(v)) t = "ok";
  else if (/(BLOCKED|404|UNKNOWN|OFFLINE|NOT SOURCE|RECOVERY)/.test(v)) t = "bad";
  else if (/(ASSIGNED|STANDBY|REPORTED|READY)/.test(v)) t = "warn";
  return `<span class="pill ${t}">${escapeHtml(text)}</span>`;
}
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}
function fmtTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || "request failed");
  return data;
}
function renderCrew(crew) {
  lastCrew = crew || [];
  const el = $("crew");
  if (!el) return;
  const filter = crewFilter || "ALL";
  const list = filter === "ALL" ? lastCrew : lastCrew.filter((c) => String(c.presence || "").toUpperCase() === filter);
  if (!list.length) {
    el.innerHTML = `<div class="empty">${filter === "ALL" ? "No crew" : "No crew match filter"}</div>`;
    return;
  }
  el.innerHTML = list.map((c) => `
    <div class="row crew-row" data-id="${escapeHtml(c.id)}">
      <div class="crew-info">
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="lane">${escapeHtml(c.role)} · ${escapeHtml(c.lane || "")}</div>
        <div class="status-line">${pill(c.status)} ${pill(c.presence)}</div>
      </div>
      <div class="btn-group presence-btns">
        ${PRESENCE.map((p) => `<button type="button" class="btn sm ${c.presence === p ? "active" : ""}" data-presence="${p}">${p}</button>`).join("")}
      </div>
    </div>`).join("");
  el.querySelectorAll(".presence-btns button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".crew-row").dataset.id;
      const presence = btn.dataset.presence;
      btn.disabled = true;
      try {
        await api(`/api/crew/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ presence, updatedBy: "operator-ui" }) });
        await refresh();
      } catch (err) {
        alert("Crew update failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}
function renderMissions(missions) {
  lastMissions = missions || [];
  const el = $("missions");
  const statusF = missionFilter || "ALL";
  const ownerF = missionOwnerFilter || "ALL";
  let list = lastMissions;
  if (statusF !== "ALL") list = list.filter((m) => String(m.status || "").toUpperCase() === statusF);
  if (ownerF !== "ALL") list = list.filter((m) => String(m.owner || "") === ownerF);
  if (!list.length) {
    el.innerHTML = `<div class="empty">${statusF === "ALL" && ownerF === "ALL" ? "No missions" : "No missions match filter"}</div>`;
    return;
  }
  el.innerHTML = list.map((m) => `
    <div class="row mission-row" data-id="${escapeHtml(m.id)}">
      <div class="mission-info">
        <div class="name">${escapeHtml(m.id)} · ${escapeHtml(m.title)}</div>
        <div class="lane">${escapeHtml(m.owner)} · ${escapeHtml(m.evidence || "")}</div>
        <div class="status-line">${pill(m.status)}</div>
      </div>
      <div class="mission-actions">
        <div class="btn-group status-btns">
          ${MISSION_STATUSES.map((s) => `<button type="button" class="btn sm ${String(m.status).toUpperCase() === s ? "active" : ""}" data-status="${s}">${s === "READY FOR REVIEW" ? "REVIEW" : s}</button>`).join("")}
        </div>
        <button type="button" class="btn sm evidence-btn" data-evidence="${escapeHtml(m.evidence || "")}">Evidence</button>
      </div>
    </div>`).join("");
  el.querySelectorAll(".status-btns button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".mission-row").dataset.id;
      const status = btn.dataset.status;
      btn.disabled = true;
      try {
        await api(`/api/missions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status, updatedBy: "operator-ui" }) });
        await refresh();
      } catch (err) {
        alert("Mission update failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
  el.querySelectorAll(".evidence-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".mission-row");
      const id = row.dataset.id;
      const current = btn.dataset.evidence || "";
      const next = prompt(`Evidence for ${id}`, current);
      if (next === null) return;
      const evidence = next.trim();
      if (evidence === current) return;
      btn.disabled = true;
      try {
        await api(`/api/missions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ evidence, updatedBy: "operator-ui" }) });
        await refresh();
      } catch (err) {
        alert("Evidence update failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}
function systemStatusMatch(current, candidate) {
  const c = String(current || "").toUpperCase();
  const k = String(candidate || "").toUpperCase();
  if (c === k) return true;
  if (k === "OK" && /\bOK\b|PERSISTENT|FOUNDATION|SEED|ACTIVE/.test(c) && !/UNVERIFIED|UNKNOWN|404|RECOVERY/.test(c)) return true;
  if (k === "ACTIVE" && /\bACTIVE\b/.test(c) && !/UNVERIFIED/.test(c)) return true;
  if (k === "UNVERIFIED" && /UNVERIFIED/.test(c)) return true;
  if (k === "UNKNOWN" && /UNKNOWN/.test(c)) return true;
  if (k === "RECOVERY" && /RECOVERY/.test(c)) return true;
  if (k === "404" && /404/.test(c)) return true;
  return false;
}
function renderSystems(systems) {
  lastSystems = systems || [];
  const el = $("systems");
  const filter = systemFilter || "ALL";
  const list = filter === "ALL" ? lastSystems : lastSystems.filter((sys) => systemStatusMatch(sys.status, filter));
  if (!list.length) {
    el.innerHTML = `<div class="empty">${filter === "ALL" ? "No systems" : "No systems match filter"}</div>`;
    return;
  }
  el.innerHTML = list.map((s) => `
    <div class="row system-row" data-id="${escapeHtml(s.id)}">
      <div class="system-info">
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="lane">${escapeHtml(s.home || "")}</div>
        <div class="status-line">${pill(s.status)}</div>
      </div>
      <div class="btn-group system-btns">
        ${SYSTEM_STATUSES.map((st) => `<button type="button" class="btn sm ${systemStatusMatch(s.status, st) ? "active" : ""}" data-status="${st}">${st}</button>`).join("")}
      </div>
    </div>`).join("");
  el.querySelectorAll(".system-btns button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".system-row").dataset.id;
      const status = btn.dataset.status;
      btn.disabled = true;
      try {
        await api(`/api/systems/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status, updatedBy: "operator-ui" }) });
        await refresh();
      } catch (err) {
        alert("System update failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}
function renderRepos(repos) {
  const el = $("repos");
  if (!repos?.length) {
    el.innerHTML = `<div class="empty">No sister repos</div>`;
    return;
  }
  el.innerHTML = repos.map((r) => `
    <div class="row">
      <div>
        <div class="name"><a class="link" href="${escapeHtml(r.url || "#")}" target="_blank" rel="noreferrer">${escapeHtml(r.name)}</a></div>
        <div class="lane">${escapeHtml(r.role || "")}</div>
      </div>
      ${pill(r.status)}
    </div>`).join("");
}
function eventTypeMatch(type, filter) {
  if (!filter || filter === "ALL") return true;
  const t = String(type || "").toLowerCase();
  const f = String(filter).toLowerCase();
  if (f === "mission") return t.startsWith("mission");
  if (f === "crew") return t.startsWith("crew");
  if (f === "system") return t.startsWith("system");
  if (f === "sister-repo") return t.startsWith("sister-repo") || t.startsWith("sister");
  if (f === "handoff") return t === "handoff" || t.startsWith("handoff");
  if (f === "note") return t === "note";
  if (f === "sweep") return t === "sweep" || t.startsWith("sweep.");
  return t === f;
}
function renderEvents(events) {
  lastEvents = events || [];
  const el = $("events");
  const filter = eventFilter || "ALL";
  const list = filter === "ALL" ? lastEvents : lastEvents.filter((e) => eventTypeMatch(e.type, filter));
  if (!list.length) {
    el.innerHTML = `<div class="empty">${filter === "ALL" ? "No activity yet" : "No events match filter"}</div>`;
    return;
  }
  el.innerHTML = list.slice(0, 40).map((e) => `
    <div class="event">
      <span class="event-time">${fmtTime(e.at)}</span>
      <span class="event-type">${escapeHtml(e.type || "note")}</span>
      <span class="event-msg">${escapeHtml(e.message)}</span>
    </div>`).join("");
}
function renderRoundtable(rt) {
  const el = $("roundtable");
  if (!el) return;
  if (!rt) {
    el.innerHTML = `<div class="empty">…</div>`;
    return;
  }
  const counts = rt.counts || {};
  const next = (rt.nextTalk || []).join(" · ") || "Room is clear.";
  el.innerHTML = `
    <div class="rt-counts">
      <span class="rt-chip bad">Blocked ${counts.blocked ?? 0}</span>
      <span class="rt-chip warn">Review ${counts.review ?? 0}</span>
      <span class="rt-chip ok">Active ${counts.active ?? 0}</span>
      <span class="rt-chip cyan">Josh ${counts.joshDecisions ?? 0}</span>
      <span class="rt-chip">Offline ${counts.offline ?? 0}</span>
    </div>
    <p class="rt-next">${escapeHtml(next)}</p>`;
}
function renderHandoffs(store) {
  const el = $("handoffs");
  const list = store?.handoffs || [];
  if (!list.length) {
    el.innerHTML = `<div class="empty">No handoffs yet</div>`;
    return;
  }
  el.innerHTML = list.slice(0, 15).map((h) => `
    <div class="event">
      <span class="event-time">${fmtTime(h.at)}</span>
      <span class="event-type">${escapeHtml(h.name)} · ${escapeHtml(h.assignmentId)}</span>
      <span class="event-msg">${pill(h.status)}${h.joshDecisionRequired ? " · JOSH" : ""} ${escapeHtml(h.nextAction || h.completed || "")}</span>
    </div>`).join("");
}
function fillOwnerSelect(crew) {
  const sel = $("owner");
  if (!sel) return;
  const names = (crew || []).map((c) => c.name);
  if (!names.includes("Josh")) names.unshift("Josh");
  sel.innerHTML = names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
}
function fillMissionOwnerFilter(crew, missions) {
  const sel = $("mission-owner-filter");
  if (!sel) return;
  const current = missionOwnerFilter || "ALL";
  const fromCrew = (crew || []).map((c) => c.name);
  const fromMissions = (missions || []).map((m) => m.owner).filter(Boolean);
  const names = [...new Set([...fromCrew, ...fromMissions])].sort((a, b) => a.localeCompare(b));
  if (!names.includes("Josh")) names.unshift("Josh");
  sel.innerHTML = `<option value="ALL">All</option>` + names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  sel.value = names.includes(current) || current === "ALL" ? current : "ALL";
}
function handoffToBrainMd() {
  const name = $("ho-name")?.value.trim() || "";
  const assignmentId = $("ho-assignment")?.value.trim() || "";
  const status = $("ho-status")?.value || "";
  const completed = $("ho-completed")?.value.trim() || "";
  const evidence = $("ho-evidence")?.value.trim() || "";
  const tools = $("ho-tools")?.value.trim() || "";
  const verified = $("ho-verified")?.value.trim() || "";
  const remains = $("ho-remains")?.value.trim() || "";
  const blockers = $("ho-blockers")?.value.trim() || "";
  const nextAction = $("ho-next")?.value.trim() || "";
  const joshReq = $("ho-josh")?.checked ? "YES" : "NO";
  const joshNote = $("ho-josh-note")?.value.trim() || "";
  const at = new Date().toISOString();
  return [
    `### Handoff — ${name || "(name)"} · ${assignmentId || "(id)"}`,
    ``,
    `- **When:** ${at}`,
    `- **Status:** ${status}`,
    `- **What was completed:** ${completed || "—"}`,
    `- **Evidence / file location:** ${evidence || "—"}`,
    `- **Tools used:** ${tools || "—"}`,
    `- **What was verified:** ${verified || "—"}`,
    `- **What remains:** ${remains || "—"}`,
    `- **Blockers:** ${blockers || "—"}`,
    `- **Recommended next action:** ${nextAction || "—"}`,
    `- **Josh decision required:** ${joshReq}${joshNote ? ` — ${joshNote}` : ""}`,
    ``,
  ].join("\n");
}
async function copyBrainMd() {
  const md = handoffToBrainMd();
  try {
    await navigator.clipboard.writeText(md);
    const btn = $("ho-copy-md");
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = prev; }, 1500);
    }
  } catch (err) {
    prompt("Copy this into the Brain:", md);
  }
}
async function refresh() {
  const [state, rt, handoffs] = await Promise.all([api("/api/state"), api("/api/roundtable"), api("/api/handoffs")]);
  const stamp = $("stamp");
  if (stamp) stamp.textContent = state.updatedAt ? `Updated ${fmtTime(state.updatedAt)} · ${BUILD}` : BUILD;
  const health = $("health-chip");
  if (health) {
    health.textContent = "LIVE";
    health.className = "rt-chip ok";
  }
  renderBoardPulse(state);
  renderCrew(state.crew);
  fillMissionOwnerFilter(state.crew, state.missions);
  applyFilterSelects();
  renderMissions(state.missions);
  renderSystems(state.systems);
  renderRepos(state.sisterRepos);
  renderEvents(state.events);
  renderRoundtable(rt);
  renderHandoffs(handoffs);
  fillOwnerSelect(state.crew);
  return state;
}
function startLiveRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => { refresh().catch(() => {}); }, REFRESH_MS);
}
function wireForms() {
  $("mission-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("title").value.trim();
    if (!title) return;
    try {
      await api("/api/missions", { method: "POST", body: JSON.stringify({ title, owner: $("owner").value, status: $("status").value, updatedBy: "operator-ui" }) });
      $("title").value = "";
      await refresh();
    } catch (err) {
      alert("Add mission failed: " + err.message);
    }
  });
  $("note-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = $("note-msg").value.trim();
    if (!message) return;
    try {
      await api("/api/events", { method: "POST", body: JSON.stringify({ type: "note", message, by: "operator-ui" }) });
      $("note-msg").value = "";
      await refresh();
    } catch (err) {
      alert("Log note failed: " + err.message);
    }
  });
  $("handoff-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      name: $("ho-name").value.trim(),
      assignmentId: $("ho-assignment").value.trim(),
      status: $("ho-status").value,
      completed: $("ho-completed").value.trim(),
      evidence: $("ho-evidence").value.trim(),
      tools: $("ho-tools").value.trim(),
      verified: $("ho-verified").value.trim(),
      remains: $("ho-remains").value.trim(),
      blockers: $("ho-blockers").value.trim(),
      nextAction: $("ho-next").value.trim(),
      joshDecisionRequired: $("ho-josh").checked,
      joshDecisionNote: $("ho-josh-note").value.trim(),
      updatedBy: "operator-ui",
    };
    if (!body.name || !body.assignmentId) {
      alert("Name and Assignment ID required");
      return;
    }
    try {
      await api("/api/handoffs", { method: "POST", body: JSON.stringify(body) });
      e.target.reset();
      $("ho-status").value = "ACTIVE";
      await refresh();
    } catch (err) {
      alert("Handoff save failed: " + err.message);
    }
  });
  $("ho-copy-md")?.addEventListener("click", () => { copyBrainMd(); });
  $("mission-filter")?.addEventListener("change", (e) => { missionFilter = e.target.value || "ALL"; saveFilters(); renderMissions(lastMissions); });
  $("mission-owner-filter")?.addEventListener("change", (e) => { missionOwnerFilter = e.target.value || "ALL"; saveFilters(); renderMissions(lastMissions); });
  $("crew-filter")?.addEventListener("change", (e) => { crewFilter = e.target.value || "ALL"; saveFilters(); renderCrew(lastCrew); });
  $("event-filter")?.addEventListener("change", (e) => { eventFilter = e.target.value || "ALL"; saveFilters(); renderEvents(lastEvents); });
  $("system-filter")?.addEventListener("change", (e) => { systemFilter = e.target.value || "ALL"; saveFilters(); renderSystems(lastSystems); });
  $("reset-filters")?.addEventListener("click", () => { resetFilters(); });
}
loadFilters();
wireForms();
applyFilterSelects();
function renderBoardPulse(state) {
  const el = $("board-pulse");
  if (!el) return;
  const crew = state.crew || [];
  const missions = state.missions || [];
  const systems = state.systems || [];
  const online = crew.filter((c) => String(c.presence || "").toUpperCase() === "ONLINE").length;
  const blocked = missions.filter((m) => String(m.status || "").toUpperCase() === "BLOCKED").length;
  const active = missions.filter((m) => String(m.status || "").toUpperCase() === "ACTIVE").length;
  const hot = systems.filter((s) => /UNKNOWN|404|RECOVERY|UNVERIFIED/i.test(String(s.status || ""))).length;
  el.innerHTML = `
    <span class="rt-chip ok">Online ${online}</span>
    <span class="rt-chip cyan">Active ${active}</span>
    <span class="rt-chip bad">Blocked ${blocked}</span>
    <span class="rt-chip warn">Systems hot ${hot}</span>`;
}
refresh()
  .then(() => startLiveRefresh())
  .catch((err) => {
    const stamp = $("stamp");
    if (stamp) stamp.textContent = "Load failed: " + err.message;
    const health = $("health-chip");
    if (health) {
      health.textContent = "DOWN";
      health.className = "rt-chip bad";
    }
    console.error(err);
  });
