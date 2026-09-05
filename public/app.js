const $ = (id) => document.getElementById(id);
function tone(value) {
  const v = String(value || "").toUpperCase();
  if (/(COMPLETE|VERIFIED|ACTIVE|ONLINE|OK|PASSED)/.test(v) && !/UNVERIFIED|NOT /.test(v)) return "ok";
  if (/(BLOCKED|404|UNKNOWN|PENDING|OFFLINE|RECOVERY)/.test(v)) return "bad";
  if (/(ASSIGNED|STANDBY|REPORTED|POC)/.test(v)) return "warn";
  return "cyan";
}
function pill(text) {
  return `<span class="pill ${tone(text)}">${text}</span>`;
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
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}
function handoffToBrainMd(h) {
  const lines = [
    `### Handoff — ${h.name || ""} · ${h.assignmentId || ""}`,
    ``,
    `- **Status:** ${h.status || ""}`,
    `- **At:** ${h.at || ""}`,
    `- **Completed:** ${h.completed || "—"}`,
    `- **Evidence:** ${h.evidence || "—"}`,
    `- **Tools used:** ${h.tools || "—"}`,
    `- **Verified:** ${h.verified || "—"}`,
    `- **Remains:** ${h.remains || "—"}`,
    `- **Blockers:** ${h.blockers || "—"}`,
    `- **Next action:** ${h.nextAction || "—"}`,
    `- **Josh decision required:** ${h.joshDecisionRequired ? "YES" : "NO"}${h.joshDecisionNote ? ` — ${h.joshDecisionNote}` : ""}`,
    `- **Logged by:** ${h.by || "operator"}`,
    ``,
  ];
  return lines.join("\n");
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}
const PRESENCE = ["ONLINE", "STANDBY", "OFFLINE"];
const MISSION_STATUSES = ["ASSIGNED", "ACTIVE", "READY FOR REVIEW", "COMPLETE", "BLOCKED"];
const SYSTEM_STATUSES = [
  "ACTIVE",
  "VERIFIED",
  "UNVERIFIED",
  "UNKNOWN",
  "RECOVERY REQUIRED",
  "404 / PRIVATE",
  "POC",
  "NOT SOURCE OF TRUTH",
];
const SISTER_STATUSES = [
  "ACTIVE",
  "VERIFIED",
  "POC",
  "NOT SOURCE OF TRUTH",
  "UNKNOWN",
  "ARCHIVED",
];
async function setPresence(id, presence) {
  await fetch(`/api/crew/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presence, updatedBy: "operator-ui" }),
  });
  load();
}
async function setMissionStatus(id, status) {
  await fetch(`/api/missions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, updatedBy: "operator-ui" }),
  });
  load();
}
async function setSystemStatus(id, status) {
  await fetch(`/api/systems/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, updatedBy: "operator-ui" }),
  });
  load();
}
async function setSisterStatus(name, status) {
  await fetch(`/api/sister-repos/${encodeURIComponent(name)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, updatedBy: "operator-ui" }),
  });
  load();
}
async function loadRoundtable() {
  const el = $("roundtable");
  if (!el) return;
  try {
    const res = await fetch("/api/roundtable");
    const t = await res.json();
    const c = t.counts || {};
    const talk = (t.nextTalk || []).length
      ? `<div class="talk-list">${t.nextTalk.map((x) => `<div class="talk-item">${esc(x)}</div>`).join("")}</div>`
      : `<div class="empty">Board is clean. Sit down and make something.</div>`;
    const list = (items, empty) =>
      items && items.length
        ? items.map((m) => `
            <div class="row">
              <div>
                <div class="name">${esc(m.id || m.name)} · ${esc(m.title || m.assignmentId || m.role || "")}</div>
                <div class="lane">${esc(m.owner || m.home || m.joshDecisionNote || m.evidence || m.presence || "")}</div>
              </div>
              ${pill(m.status || m.presence || "OPEN")}
            </div>`).join("")
        : `<div class="empty">${empty}</div>`;
    el.innerHTML = `
      <div class="counts">
        ${pill(c.blocked + " blocked")}
        ${pill(c.review + " review")}
        ${pill(c.active + " active")}
        ${pill(c.joshDecisions + " Josh decisions")}
      </div>
      ${talk}
      <h2>Blocked</h2>
      ${list(t.blocked, "No blocked missions.")}
      <h2>Ready for review</h2>
      ${list(t.readyForReview, "Nothing waiting on review.")}
      <h2>Josh decisions</h2>
      ${list(t.joshDecisions, "No Josh decisions queued.")}
      <h2>Systems to verify</h2>
      ${list(t.systemsNeedingVerify, "No unverified systems in this snapshot.")}
    `;
  } catch (err) {
    el.innerHTML = `<div class="empty">Round table load failed: ${esc(err.message)}</div>`;
  }
}
async function loadHandoffs() {
  try {
    const res = await fetch("/api/handoffs");
    const data = await res.json();
    const list = data.handoffs || [];
    if (!list.length) {
      $("handoffs").innerHTML = `<div class="empty">No handoffs yet. Use the form above when stopping work.</div>`;
      return;
    }
    $("handoffs").innerHTML = list.slice(0, 20).map((h) => `
      <div class="handoff-card" data-id="${esc(h.id)}">
        <div class="handoff-head">
          <span class="name">${esc(h.name)} · ${esc(h.assignmentId)}</span>
          ${pill(h.status)}
          <span class="event-time">${fmtTime(h.at)}</span>
          <button type="button" class="chip copy-md" data-id="${esc(h.id)}">Copy Brain MD</button>
        </div>
        ${h.completed ? `<div class="lane"><strong>Completed:</strong> ${esc(h.completed)}</div>` : ""}
        ${h.evidence ? `<div class="lane"><strong>Evidence:</strong> ${esc(h.evidence)}</div>` : ""}
        ${h.remains ? `<div class="lane"><strong>Remains:</strong> ${esc(h.remains)}</div>` : ""}
        ${h.blockers ? `<div class="lane"><strong>Blockers:</strong> ${esc(h.blockers)}</div>` : ""}
        ${h.nextAction ? `<div class="lane"><strong>Next:</strong> ${esc(h.nextAction)}</div>` : ""}
        ${h.joshDecisionRequired ? `<div class="lane josh-flag">JOSH DECISION REQUIRED${h.joshDecisionNote ? ": " + esc(h.joshDecisionNote) : ""}</div>` : ""}
      </div>
    `).join("");
    const byId = Object.fromEntries(list.map((h) => [h.id, h]));
    $("handoffs").querySelectorAll("button.copy-md").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const h = byId[btn.dataset.id];
        if (!h) return;
        const md = handoffToBrainMd(h);
        const ok = await copyText(md);
        btn.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(() => {
          btn.textContent = "Copy Brain MD";
        }, 1600);
      });
    });
  } catch (err) {
    $("handoffs").innerHTML = `<div class="empty">Handoffs load failed: ${esc(err.message)}</div>`;
  }
}
async function load() {
  const res = await fetch("/api/state");
  const state = await res.json();
  $("stamp").textContent = `${state.updatedBy || "system"} · ${state.updatedAt || ""}`;
  $("crew").innerHTML = state.crew.map((c) => `
    <div class="row crew-row">
      <div>
        <div class="name">${c.name}</div>
        <div class="lane">${c.role} — ${c.lane}</div>
        <div class="presence-btns">
          ${PRESENCE.map((p) => `
            <button
              type="button"
              class="chip ${c.presence === p ? "active " + tone(p) : ""}"
              data-id="${c.id}"
              data-presence="${p}"
            >${p}</button>
          `).join("")}
        </div>
      </div>
      <div class="status-stack">${pill(c.status)} ${pill(c.presence)}</div>
    </div>
  `).join("");
  $("crew").querySelectorAll("button[data-presence]").forEach((btn) => {
    btn.addEventListener("click", () => setPresence(btn.dataset.id, btn.dataset.presence));
  });
  $("missions").innerHTML = state.missions.map((m) => `
    <div class="row mission-row">
      <div>
        <div class="name">${m.id} · ${m.title}</div>
        <div class="ev">${m.owner} · ${m.evidence}</div>
        <div class="status-btns">
          ${MISSION_STATUSES.map((s) => `
            <button
              type="button"
              class="chip ${m.status === s ? "active " + tone(s) : ""}"
              data-id="${m.id}"
              data-status="${s}"
            >${s}</button>
          `).join("")}
        </div>
      </div>
      ${pill(m.status)}
    </div>
  `).join("");
  $("missions").querySelectorAll("button[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => setMissionStatus(btn.dataset.id, btn.dataset.status));
  });
  $("systems").innerHTML = state.systems.map((s) => `
    <div class="row system-row">
      <div>
        <div class="name">${esc(s.name)}</div>
        <div class="lane">${esc(s.home)}</div>
        <div class="status-btns">
          ${SYSTEM_STATUSES.map((st) => `
            <button
              type="button"
              class="chip ${s.status === st ? "active " + tone(st) : ""}"
              data-id="${esc(s.id)}"
              data-sys-status="${esc(st)}"
            >${esc(st)}</button>
          `).join("")}
        </div>
      </div>
      ${pill(s.status)}
    </div>
  `).join("");
  $("systems").querySelectorAll("button[data-sys-status]").forEach((btn) => {
    btn.addEventListener("click", () => setSystemStatus(btn.dataset.id, btn.dataset.sysStatus));
  });
  $("repos").innerHTML = (state.sisterRepos || []).map((r) => `
    <div class="row system-row">
      <div>
        <div class="name">${esc(r.name)}</div>
        <div class="lane">${esc(r.role)}</div>
        <a class="link" href="${esc(r.url)}" target="_blank" rel="noreferrer">open repo</a>
        <div class="status-btns">
          ${SISTER_STATUSES.map((st) => `
            <button
              type="button"
              class="chip ${r.status === st ? "active " + tone(st) : ""}"
              data-name="${esc(r.name)}"
              data-sister-status="${esc(st)}"
            >${esc(st)}</button>
          `).join("")}
        </div>
      </div>
      ${pill(r.status)}
    </div>
  `).join("");
  $("repos").querySelectorAll("button[data-sister-status]").forEach((btn) => {
    btn.addEventListener("click", () => setSisterStatus(btn.dataset.name, btn.dataset.sisterStatus));
  });
  const events = state.events || [];
  if (!events.length) {
    $("events").innerHTML = `<div class="empty">No activity yet. Change crew presence or mission status to log events.</div>`;
  } else {
    $("events").innerHTML = events.slice(0, 40).map((e) => `
      <div class="event-row">
        <div class="event-time">${fmtTime(e.at)}</div>
        <div class="event-body">
          <span class="event-type">${e.type || "note"}</span>
          <span class="event-msg">${e.message || ""}</span>
          ${e.by ? `<span class="event-by">· ${e.by}</span>` : ""}
        </div>
      </div>
    `).join("");
  }
  $("owner").innerHTML = state.crew.map((c) => `<option value="${c.name}">${c.name}</option>`).join("");
  await loadRoundtable();
  await loadHandoffs();
}
$("mission-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("title").value.trim();
  if (!title) return;
  await fetch("/api/missions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      owner: $("owner").value,
      status: $("status").value,
      evidence: "PENDING",
      updatedBy: "operator-ui",
    }),
  });
  $("title").value = "";
  load();
});
$("handoff-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("ho-name").value.trim();
  const assignmentId = $("ho-assignment").value.trim();
  if (!name || !assignmentId) return;
  await fetch("/api/handoffs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      assignmentId,
      status: $("ho-status").value,
      completed: $("ho-completed").value,
      evidence: $("ho-evidence").value,
      tools: $("ho-tools").value,
      verified: $("ho-verified").value,
      remains: $("ho-remains").value,
      blockers: $("ho-blockers").value,
      nextAction: $("ho-next").value,
      joshDecisionRequired: $("ho-josh").checked,
      joshDecisionNote: $("ho-josh-note").value,
      updatedBy: "operator-ui",
    }),
  });
  $("handoff-form").reset();
  $("ho-status").value = "ACTIVE";
  load();
});
$("note-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = $("note-msg").value.trim();
  if (!message) return;
  await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "note",
      message,
      updatedBy: "operator-ui",
    }),
  });
  $("note-msg").value = "";
  load();
});
load().catch((err) => {
  $("missions").innerHTML = `<div class="empty">State load failed: ${err.message}. Start with node server.mjs</div>`;
});
// Quiet board refresh so multi-device rooms stay in sync without a full reload.
setInterval(() => {
  if (document.visibilityState === "visible") load().catch(() => {});
}, 60000);
