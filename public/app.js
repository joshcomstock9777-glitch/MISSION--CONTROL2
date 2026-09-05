const $ = (id) => document.getElementById(id);

const PRESENCE = ["ONLINE", "STANDBY", "OFFLINE"];
const MISSION_STATUSES = ["ASSIGNED", "ACTIVE", "READY FOR REVIEW", "COMPLETE", "BLOCKED"];
const REFRESH_MS = 30000;

let lastMissions = [];
let missionFilter = "ALL";
let refreshTimer = null;

function pill(text) {
  const v = String(text || "").toUpperCase();
  let t = "cyan";
  if (/(COMPLETE|VERIFIED|ACTIVE|ONLINE|OK|PERSISTENT)/.test(v) && !/UNVERIFIED|NOT |PENDING/.test(v)) t = "ok";
  else if (/(BLOCKED|404|UNKNOWN|OFFLINE|NOT SOURCE)/.test(v)) t = "bad";
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
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
  const el = $("crew");
  if (!crew?.length) {
    el.innerHTML = `<div class="empty">No crew</div>`;
    return;
  }
  el.innerHTML = crew
    .map(
      (c) => `
    <div class="row crew-row" data-id="${escapeHtml(c.id)}">
      <div class="crew-info">
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="lane">${escapeHtml(c.role)} · ${escapeHtml(c.lane || "")}</div>
        <div class="status-line">${pill(c.status)} ${pill(c.presence)}</div>
      </div>
      <div class="btn-group presence-btns">
        ${PRESENCE.map(
          (p) =>
            `<button type="button" class="btn sm ${c.presence === p ? "active" : ""}" data-presence="${p}">${p}</button>`
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

function nextMissionStatus(current) {
  const order = ["ASSIGNED", "ACTIVE", "READY FOR REVIEW", "COMPLETE"];
  const i = order.indexOf(String(current || "").toUpperCase());
  if (i < 0 || i >= order.length - 1) return "ASSIGNED";
  return order[i + 1];
}

function renderMissions(missions) {
  lastMissions = missions || [];
  const el = $("missions");
  const filter = missionFilter || "ALL";
  const list =
    filter === "ALL"
      ? lastMissions
      : lastMissions.filter((m) => String(m.status || "").toUpperCase() === filter);

  if (!list.length) {
    el.innerHTML = `<div class="empty">${filter === "ALL" ? "No missions" : "No missions match filter"}</div>`;
    return;
  }
  el.innerHTML = list
    .map(
      (m) => `
    <div class="row mission-row" data-id="${escapeHtml(m.id)}">
      <div class="mission-info">
        <div class="name">${escapeHtml(m.id)} · ${escapeHtml(m.title)}</div>
        <div class="lane">${escapeHtml(m.owner)} · ${escapeHtml(m.evidence || "")}</div>
        <div class="status-line">${pill(m.status)}</div>
      </div>
      <div class="btn-group status-btns">
        ${MISSION_STATUSES.map(
          (s) =>
            `<button type="button" class="btn sm ${String(m.status).toUpperCase() === s ? "active" : ""}" data-status="${s}">${s === "READY FOR REVIEW" ? "REVIEW" : s}</button>`
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

function renderSystems(systems) {
  const el = $("systems");
  if (!systems?.length) {
    el.innerHTML = `<div class="empty">No systems</div>`;
    return;
  }
  el.innerHTML = systems
    .map(
      (s) => `
    <div class="row">
      <div>
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="lane">${escapeHtml(s.home || "")}</div>
      </div>
      ${pill(s.status)}
    </div>`
    )
    .join("");
}

function renderRepos(repos) {
  const el = $("repos");
  if (!repos?.length) {
    el.innerHTML = `<div class="empty">No sister repos</div>`;
    return;
  }
  el.innerHTML = repos
    .map(
      (r) => `
    <div class="row">
      <div>
        <div class="name"><a class="link" href="${escapeHtml(r.url || "#")}" target="_blank" rel="noreferrer">${escapeHtml(r.name)}</a></div>
        <div class="lane">${escapeHtml(r.role || "")}</div>
      </div>
      ${pill(r.status)}
    </div>`
    )
    .join("");
}

function renderEvents(events) {
  const el = $("events");
  if (!events?.length) {
    el.innerHTML = `<div class="empty">No activity yet</div>`;
    return;
  }
  el.innerHTML = events
    .slice(0, 40)
    .map(
      (e) => `
    <div class="event">
      <span class="event-time">${fmtTime(e.at)}</span>
      <span class="event-type">${escapeHtml(e.type || "note")}</span>
      <span class="event-msg">${escapeHtml(e.message)}</span>
    </div>`
    )
    .join("");
}

function renderRoundtable(rt) {
  const el = $("roundtable");
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
    <p class="rt-next">${escapeHtml(next)}</p>
  `;
}

function renderHandoffs(store) {
  const el = $("handoffs");
  const list = store?.handoffs || [];
  if (!list.length) {
    el.innerHTML = `<div class="empty">No handoffs yet</div>`;
    return;
  }
  el.innerHTML = list
    .slice(0, 15)
    .map(
      (h) => `
    <div class="event">
      <span class="event-time">${fmtTime(h.at)}</span>
      <span class="event-type">${escapeHtml(h.name)} · ${escapeHtml(h.assignmentId)}</span>
      <span class="event-msg">${pill(h.status)}${h.joshDecisionRequired ? " · JOSH" : ""} ${escapeHtml(h.nextAction || h.completed || "")}</span>
    </div>`
    )
    .join("");
}

function fillOwnerSelect(crew) {
  const sel = $("owner");
  if (!sel) return;
  const names = (crew || []).map((c) => c.name);
  if (!names.includes("Josh")) names.unshift("Josh");
  sel.innerHTML = names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
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
      setTimeout(() => {
        btn.textContent = prev;
      }, 1500);
    }
  } catch (err) {
    prompt("Copy this into the Brain:", md);
  }
}

async function refresh() {
  const [state, rt, handoffs] = await Promise.all([
    api("/api/state"),
    api("/api/roundtable"),
    api("/api/handoffs"),
  ]);
  $("stamp").textContent = state.updatedAt ? `Updated ${fmtTime(state.updatedAt)}` : "";
  renderCrew(state.crew);
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
  refreshTimer = setInterval(() => {
    refresh().catch(() => {});
  }, REFRESH_MS);
}

function wireForms() {
  $("mission-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("title").value.trim();
    if (!title) return;
    try {
      await api("/api/missions", {
        method: "POST",
        body: JSON.stringify({
          title,
          owner: $("owner").value,
          status: $("status").value,
          updatedBy: "operator-ui",
        }),
      });
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
      await api("/api/events", {
        method: "POST",
        body: JSON.stringify({ type: "note", message, by: "operator-ui" }),
      });
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

  $("ho-copy-md")?.addEventListener("click", () => {
    copyBrainMd();
  });

  $("mission-filter")?.addEventListener("change", (e) => {
    missionFilter = e.target.value || "ALL";
    renderMissions(lastMissions);
  });
}

wireForms();
refresh()
  .then(() => startLiveRefresh())
  .catch((err) => {
    $("stamp").textContent = "Load failed: " + err.message;
    console.error(err);
  });
