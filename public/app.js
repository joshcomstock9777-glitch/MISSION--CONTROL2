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
async function load() {
  const res = await fetch("/api/state");
  const state = await res.json();
  $("stamp").textContent = `${state.updatedBy || "system"} · ${state.updatedAt || ""}`;
  $("crew").innerHTML = state.crew.map((c) => `
    <div class="row">
      <div>
        <div class="name">${c.name}</div>
        <div class="lane">${c.role} — ${c.lane}</div>
      </div>
      <div>${pill(c.status)} ${pill(c.presence)}</div>
    </div>
  `).join("");
  $("missions").innerHTML = state.missions.map((m) => `
    <div class="row">
      <div>
        <div class="name">${m.id} · ${m.title}</div>
        <div class="ev">${m.owner} · ${m.evidence}</div>
      </div>
      ${pill(m.status)}
    </div>
  `).join("");
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
