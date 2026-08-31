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
const PRESENCE = ["ONLINE", "STANDBY", "OFFLINE"];
const MISSION_STATUSES = ["ASSIGNED", "ACTIVE", "READY FOR REVIEW", "COMPLETE", "BLOCKED"];
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
    <div class="row">
      <div>
        <div class="name">${s.name}</div>
        <div class="lane">${s.home}</div>
      </div>
      ${pill(s.status)}
    </div>
  `).join("");
  $("repos").innerHTML = state.sisterRepos.map((r) => `
    <div class="row">
      <div>
        <div class="name">${r.name}</div>
        <div class="lane">${r.role}</div>
        <a class="link" href="${r.url}" target="_blank" rel="noreferrer">open repo</a>
      </div>
      ${pill(r.status)}
    </div>
  `).join("");
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
load().catch((err) => {
  $("missions").innerHTML = `<div class="empty">State load failed: ${err.message}. Start with node server.mjs</div>`;
});
