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
let ownerFilter = "ALL";
let eventFilter = "ALL";
let crewFilter = "ALL";
const BUILD = "2026-09-07-f";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pill(text) {
  const v = String(text || "").toUpperCase();
  let t = "cyan";
  if (/(COMPLETE|VERIFIED|ACTIVE|ONLINE|OK|PERSISTENT)/.test(v) && !/UNVERIFIED|NOT |PENDING|REPORTED/.test(v)) t = "ok";
  else if (/(BLOCKED|404|UNKNOWN|OFFLINE|RECOVERY)/.test(v)) t = "bad";
  else if (/(ASSIGNED|STANDBY|REPORTED|READY)/.test(v)) t = "warn";
  return `<span class="pill ${t}">${escapeHtml(text)}</span>`;
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

function presenceMatch(a, b) {
  return String(a || "").toUpperCase() === String(b || "").toUpperCase();
}

function uniqueOwners(missions) {
  const set = new Set();
  (missions || []).forEach((m) => {
    const o = String(m.owner || "").trim();
    if (o) set.add(o);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function renderOwnerFilters(missions) {
  const el = $("mission-owner-filters");
  if (!el) return;
  const owners = uniqueOwners(missions);
  const current = ownerFilter;
  el.innerHTML =
    `<button type="button" class="chip ${current === "ALL" ? "active" : ""}" data-owner-filter="ALL">All owners</button>` +
    owners
      .map(
        (o) =>
          `<button type="button" class="chip ${current === o ? "active" : ""}" data-owner-filter="${escapeHtml(o)}">${escapeHtml(o)}</button>`
      )
      .join("");

  el.querySelectorAll("[data-owner-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ownerFilter = btn.dataset.ownerFilter;
      el.querySelectorAll("[data-owner-filter]").forEach((b) =>
        b.classList.toggle("active", b.dataset.ownerFilter === ownerFilter)
      );
      renderMissions(lastMissions);
    });
  });
}

function renderCrew(crew) {
  lastCrew = crew || [];
  const el = $("crew");
  if (!el) return;
  let list = lastCrew;
  if (crewFilter !== "ALL") {
    list = list.filter((c) => presenceMatch(c.presence, crewFilter));
  }
  if (!list.length) {
    el.innerHTML = `<div class="empty">No crew match</div>`;
    return;
  }
  el.innerHTML = list
    .map(
      (c) => `
    <div class="row crew-row" data-id="${escapeHtml(c.id)}">
      <div>
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="lane">${escapeHtml(c.role)} — ${escapeHtml(c.lane || "")}</div>
        <div class="status-line">${pill(c.presence)} ${pill(c.status)}</div>
      </div>
      <div class="btn-group presence-btns">
        ${PRESENCE.map(
          (p) =>
            `<button type="button" class="btn sm ${presenceMatch(c.presence, p) ? "active" : ""}" data-presence="${p}">${p}</button>`
        ).join("")}
      </div>
    </div>`
    )
    .join("");

  el.querySelectorAll(".presence-btns button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".crew-row").dataset.id;
      const presence = btn.dataset.presence;
      btn.disabled = true;
      try {
        await api(`/api/crew/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ presence, updatedBy: "operator-ui" }),
        });
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
  if (!el) return;
  let list = lastMissions;
  if (missionFilter !== "ALL") {
    list = list.filter((m) => String(m.status || "").toUpperCase() === missionFilter);
  }
  if (ownerFilter !== "ALL") {
    list = list.filter((m) => String(m.owner || "").trim() === ownerFilter);
  }
  if (!list.length) {
    el.innerHTML = `<div class="empty">No missions match</div>`;
    return;
  }
  el.innerHTML = list
    .map(
      (m) => `
    <div class="row mission-row" data-id="${escapeHtml(m.id)}">
      <div>
        <div class="name">${escapeHtml(m.id)} · ${escapeHtml(m.title)}</div>
        <div class="lane">${escapeHtml(m.owner)} · ${escapeHtml(m.evidence || "")}</div>
        <div class="status-line">${pill(m.status)}</div>
      </div>
      <div class="btn-group status-btns">
        ${MISSION_STATUSES.map(
          (st) =>
            `<button type="button" class="btn sm ${String(m.status || "").toUpperCase() === st ? "active" : ""}" data-status="${st}">${st === "READY FOR REVIEW" ? "REVIEW" : st}</button>`
        ).join("")}
      </div>
    </div>`
    )
    .join("");

  el.querySelectorAll(".status-btns button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".mission-row").dataset.id;
      const status = btn.dataset.status;
      btn.disabled = true;
      try {
        await api(`/api/missions/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status, updatedBy: "operator-ui" }),
        });
        await refresh();
      } catch (err) {
        alert("Mission update failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function renderEvents(events) {
  lastEvents = events || [];
  const el = $("events");
  if (!el) return;
  let list = lastEvents;
  if (eventFilter !== "ALL") {
    list = list.filter((e) => String(e.type || "").toLowerCase().includes(eventFilter.toLowerCase()));
  }
  if (!list.length) {
    el.innerHTML = `<div class="empty">No events yet</div>`;
    return;
  }
  el.innerHTML = list
    .slice(0, 40)
    .map((e) => {
      const when = e.at ? new Date(e.at).toLocaleString() : "";
      return `<div class="event">
        <div class="when">${escapeHtml(when)} · ${escapeHtml(e.type || "note")}${e.by ? " · " + escapeHtml(e.by) : ""}</div>
        <div class="msg">${escapeHtml(e.message || "")}</div>
      </div>`;
    })
    .join("");
}

function renderSystems(systems) {
  lastSystems = systems || [];
  const el = $("systems");
  if (!el) return;
  if (!lastSystems.length) {
    el.innerHTML = `<div class="empty">No systems</div>`;
    return;
  }
  el.innerHTML = lastSystems
    .map(
      (s) => `
    <div class="row system-row" data-id="${escapeHtml(s.id)}">
      <div>
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="lane">${escapeHtml(s.home || "")}</div>
        <div class="status-line">${pill(s.status)}</div>
      </div>
      <div class="btn-group system-btns">
        ${SYSTEM_STATUSES.map(
          (st) =>
            `<button type="button" class="btn sm ${String(s.status || "").toUpperCase().includes(st) ? "active" : ""}" data-status="${st}">${st}</button>`
        ).join("")}
      </div>
    </div>`
    )
    .join("");

  el.querySelectorAll(".system-btns button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".system-row").dataset.id;
      const status = btn.dataset.status;
      btn.disabled = true;
      try {
        await api(`/api/systems/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status, updatedBy: "operator-ui" }),
        });
        await refresh();
      } catch (err) {
        alert("System update failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function renderHandoffs(store) {
  const el = $("handoffs-list");
  if (!el) return;
  const list = store?.handoffs || [];
  if (!list.length) {
    el.innerHTML = `<div class="empty">No handoffs saved</div>`;
    return;
  }
  el.innerHTML = list
    .slice(0, 12)
    .map(
      (h) => `
    <div class="row">
      <div>
        <div class="name">${escapeHtml(h.name)} · ${escapeHtml(h.assignmentId)}</div>
        <div class="lane">${escapeHtml(h.status)} · ${h.at ? new Date(h.at).toLocaleString() : ""}</div>
        <div class="lane">${escapeHtml((h.completed || h.nextAction || "").slice(0, 120))}</div>
        ${h.joshDecisionRequired ? `<div class="status-line">${pill("JOSH DECISION")}</div>` : ""}
      </div>
    </div>`
    )
    .join("");
}

function wireFilters() {
  document.querySelectorAll("[data-mission-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      missionFilter = btn.dataset.missionFilter;
      document.querySelectorAll("[data-mission-filter]").forEach((b) => b.classList.toggle("active", b === btn));
      renderMissions(lastMissions);
    });
  });
  document.querySelectorAll("[data-crew-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      crewFilter = btn.dataset.crewFilter;
      document.querySelectorAll("[data-crew-filter]").forEach((b) => b.classList.toggle("active", b === btn));
      renderCrew(lastCrew);
    });
  });
  document.querySelectorAll("[data-event-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      eventFilter = btn.dataset.eventFilter;
      document.querySelectorAll("[data-event-filter]").forEach((b) => b.classList.toggle("active", b === btn));
      renderEvents(lastEvents);
    });
  });
}

function wireHandoff() {
  const form = $("handoff-form");
  if (!form || form.dataset.wired === "1") return;
  form.dataset.wired = "1";
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const body = {
      name: fd.get("name"),
      assignmentId: fd.get("assignmentId"),
      status: fd.get("status") || "REPORTED",
      completed: fd.get("completed"),
      evidence: fd.get("evidence"),
      tools: fd.get("tools"),
      verified: fd.get("verified"),
      remains: fd.get("remains"),
      blockers: fd.get("blockers"),
      nextAction: fd.get("nextAction"),
      joshDecisionRequired: fd.get("joshDecisionRequired") === "YES",
      joshDecisionNote: fd.get("joshDecisionNote"),
      updatedBy: "operator-ui",
    };
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      await api("/api/handoffs", { method: "POST", body: JSON.stringify(body) });
      form.reset();
      await refresh();
    } catch (err) {
      alert("Handoff save failed: " + err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

async function refresh() {
  const [state, eventsRes, handoffs] = await Promise.all([
    api("/api/state"),
    api("/api/events"),
    api("/api/handoffs"),
  ]);
  const stamp = $("stamp");
  if (stamp) {
    stamp.textContent = `${state.updatedAt ? new Date(state.updatedAt).toLocaleString() : "—"} · ${BUILD}`;
  }
  renderCrew(state.crew || []);
  renderOwnerFilters(state.missions || []);
  renderMissions(state.missions || []);
  renderSystems(state.systems || []);
  renderEvents(eventsRes.events || state.events || []);
  renderHandoffs(handoffs);
  if (typeof renderRepos === "function") {
    renderRepos(state.sisterRepos || []);
  }
}

wireFilters();
wireHandoff();
refresh().catch((err) => {
  const stamp = $("stamp");
  if (stamp) stamp.textContent = "load failed: " + err.message;
});
setInterval(() => {
  refresh().catch(() => {});
}, REFRESH_MS);
