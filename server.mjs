import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3030);
const HOST = process.env.HOST || "0.0.0.0";
const DATA = path.join(__dirname, "data");
const STATE = path.join(DATA, "state.json");
const SEED = path.join(DATA, "seed.json");
const HANDOFFS = path.join(DATA, "handoffs.json");
const PUBLIC = path.join(__dirname, "public");

const BRAIN_RAW =
  "https://raw.githubusercontent.com/joshcomstock9777-glitch/studio-behind-the-cast/main/STUDIO_BRAIN.md";
const BRAIN_FETCH_MS = 4000;

function loadState() {
  if (fs.existsSync(STATE)) return JSON.parse(fs.readFileSync(STATE, "utf8"));
  const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
  fs.writeFileSync(STATE, JSON.stringify(seed, null, 2));
  return seed;
}

function saveState(state) {
  state.updatedAt = new Date().toISOString();
  if (!Array.isArray(state.events)) state.events = [];
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  return state;
}

function loadHandoffs() {
  if (fs.existsSync(HANDOFFS)) {
    const raw = JSON.parse(fs.readFileSync(HANDOFFS, "utf8"));
    return Array.isArray(raw.handoffs) ? raw : { handoffs: Array.isArray(raw) ? raw : [] };
  }
  const empty = { handoffs: [] };
  fs.writeFileSync(HANDOFFS, JSON.stringify(empty, null, 2));
  return empty;
}

function saveHandoffs(store) {
  if (!Array.isArray(store.handoffs)) store.handoffs = [];
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(HANDOFFS, JSON.stringify(store, null, 2));
  return store;
}

function pushEvent(state, type, message, meta = {}) {
  if (!Array.isArray(state.events)) state.events = [];
  state.events.unshift({
    id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    type,
    message,
    ...meta,
  });
  if (state.events.length > 100) state.events.length = 100;
}

function buildRoundtable(state, handoffs) {
  const missions = state.missions || [];
  const blocked = missions.filter((m) => String(m.status || "").toUpperCase() === "BLOCKED");
  const review = missions.filter((m) => String(m.status || "").toUpperCase() === "READY FOR REVIEW");
  const active = missions.filter((m) => String(m.status || "").toUpperCase() === "ACTIVE");
  const josh = (handoffs || []).filter((h) => h.joshDecisionRequired);
  const offlineCrew = (state.crew || [])
    .filter((c) => String(c.presence || "").toUpperCase() === "OFFLINE")
    .map((c) => ({ id: c.id, name: c.name, role: c.role, presence: c.presence }));
  const systemsNeedingVerify = (state.systems || []).filter((s) =>
    /UNKNOWN|404|RECOVERY|UNVERIFIED/i.test(String(s.status || ""))
  );
  const nextTalk = [
    blocked.length ? `${blocked.length} blocked mission(s)` : null,
    review.length ? `${review.length} ready for review` : null,
    josh.length ? `${josh.length} Josh decision(s) in handoffs` : null,
    systemsNeedingVerify.length ? `${systemsNeedingVerify.length} system(s) unverified` : null,
    offlineCrew.length ? `${offlineCrew.length} crew offline` : null,
  ].filter(Boolean);
  return {
    at: new Date().toISOString(),
    counts: {
      blocked: blocked.length,
      review: review.length,
      active: active.length,
      joshDecisions: josh.length,
      offline: offlineCrew.length,
    },
    blocked,
    readyForReview: review,
    joshDecisions: josh.slice(0, 10),
    offlineCrew,
    systemsNeedingVerify,
    nextTalk,
  };
}

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function mime(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function serveStatic(res, urlPath) {
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  let file = path.join(PUBLIC, safe === "/" ? "index.html" : safe);
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end("forbidden");
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(PUBLIC, "index.html");
  }
  res.writeHead(200, { "Content-Type": mime(file) });
  res.end(fs.readFileSync(file));
}

function staticBrainSnapshot() {
  return {
    snapshotAt: new Date().toISOString(),
    live: false,
    disclaimer:
      "Read-only snapshot for operator awareness. Canonical memory remains studio-behind-the-cast/STUDIO_BRAIN.md. This page does not write or replace the Brain.",
    source: {
      repo: "joshcomstock9777-glitch/studio-behind-the-cast",
      path: "STUDIO_BRAIN.md",
      branch: "main",
      status: "ACTIVE",
      custodian: "Amber",
      authority: "Josh",
      url: "https://github.com/joshcomstock9777-glitch/studio-behind-the-cast",
    },
    coreRule:
      "If it is not recorded in the Studio Brain, it did not happen. Verify instead of assuming. Never store secrets. Josh approves publish, spend, delete, and external access.",
    roster: [
      { name: "Josh", role: "Architect", status: "VERIFIED", lane: "Final creative authority, identity, vision, taste, approval" },
      { name: "Amber", role: "Studio Manager", status: "VERIFIED", lane: "Operations, assignments, verification, Brain, handoffs" },
      { name: "Allie 2.0", role: "Primary Creative Partner", status: "REPORTED ACTIVE", lane: "Creative partnership and workbench" },
      { name: "Tigra", role: "Social Showrunner & Community Lead", status: "VERIFIED CHECK-IN", lane: "Social strategy, cultural radar, engagement, character voice, hooks, captions" },
      { name: "Slick", role: "Infrastructure Operator, Runner & Publishing Support", status: "VERIFIED ACTIVE IN GEMINI SPARK", lane: "Infrastructure, account readiness, technical handoffs, publishing preparation" },
      { name: "Artisa", role: "Master Visual & Pacing Editor", status: "VERIFIED CHECK-IN", lane: "Fine cuts, pacing, continuity, visual masters" },
      { name: "The Scout", role: "Free-tier & Resource Acquisition", status: "REPORTED", lane: "Tools, terms, limits, privacy, expiration" },
      { name: "Role / Erole", role: "Audio Specialist", status: "NAME PENDING VERIFICATION", lane: "Audio treatment, music, voice, mix" },
    ],
    assignments: [
      { id: "SLI-001", owner: "Slick", title: "Read-only infrastructure and publishing-readiness audit", status: "ACTIVE", evidence: "Platform-by-platform evidence and official sources" },
      { id: "SLI-002", owner: "Slick", title: "Verify GitHub repository, branch, Brain path, and access", status: "ASSIGNED", evidence: "Remote read test of STUDIO_BRAIN.md" },
      { id: "TIG-001", owner: "Tigera", title: "Cock Dracula / Everyday Vampire launch plan", status: "ASSIGNED", evidence: "3 series, 5 hooks, 7-day schedule, 10 replies, outreach, metrics" },
      { id: "CD-001", owner: "Artisa", title: "Identify exact Cock Dracula source files, durations, and best takes", status: "ASSIGNED", evidence: "Source-media manifest" },
      { id: "AUDIO-001", owner: "Role / Erole", title: "Audio-role check-in and capability audit", status: "BLOCKED", evidence: "Exact displayed name and verified check-in" },
      { id: "BRAIN-001", owner: "Amber", title: "Establish canonical GitHub Studio Brain", status: "COMPLETE", evidence: "STUDIO_BRAIN.md on main" },
      { id: "BRAIN-002", owner: "Amber", title: "Record chain probe, corrections, and synchronized snapshot", status: "READY FOR REVIEW", evidence: "Journal entry plus brain/current.json on main" },
    ],
    notes: [
      "Do not merge Amber and Allie.",
      "Canonical roster spelling is Tigra (corrected 2026-09-05).",
      "Platform matrix (IG, FB, Threads, TikTok, YT, X) remains largely UNKNOWN — verify capability by capability.",
      "Handoff form on Mission Control matches the Brain template; saves to data/handoffs.json (does not auto-write the Brain).",
      "Sister systems: studio-behind-the-cast (Brain), moonshadow-studio-go (mobile creative room). Mission Control does not replace them.",
    ],
  };
}

function parseMarkdownTableRows(md, headerHint) {
  const lines = md.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(headerHint) && lines[i].trim().startsWith("|")) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];
  const rows = [];
  for (let i = start + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    if (cells.length >= 4) rows.push(cells);
  }
  return rows;
}

function parseBrainMd(md) {
  const rosterRows = parseMarkdownTableRows(md, "| Name | Role |");
  const assignRows = parseMarkdownTableRows(md, "| ID | Owner |");
  const roster = rosterRows
    .filter((c) => c[0] && !/additional editors/i.test(c[0]))
    .map((c) => ({
      name: c[0],
      role: c[1],
      status: c[2],
      lane: c[3] || "",
    }));
  const assignments = assignRows.map((c) => ({
    id: c[0],
    owner: c[1],
    title: c[2],
    status: c[3],
    evidence: c[4] || "",
  }));
  let coreRule =
    "If it is not recorded in the Studio Brain, it did not happen. Verify instead of assuming. Never store secrets. Josh approves publish, spend, delete, and external access.";
  const notes = [];
  if (/Tigra/.test(md)) notes.push("Canonical roster spelling is Tigra (live read).");
  notes.push("Do not merge Amber and Allie.");
  notes.push("Live snapshot parsed from raw STUDIO_BRAIN.md (read-only). Does not write the Brain.");
  notes.push("Sister systems: studio-behind-the-cast (Brain), moonshadow-studio-go (mobile creative room). Mission Control does not replace them.");

  return {
    snapshotAt: new Date().toISOString(),
    live: true,
    disclaimer:
      "LIVE read-only snapshot from raw STUDIO_BRAIN.md. Canonical memory remains studio-behind-the-cast. This page does not write or replace the Brain.",
    source: {
      repo: "joshcomstock9777-glitch/studio-behind-the-cast",
      path: "STUDIO_BRAIN.md",
      branch: "main",
      status: "ACTIVE",
      custodian: "Amber",
      authority: "Josh",
      url: "https://github.com/joshcomstock9777-glitch/studio-behind-the-cast",
    },
    coreRule,
    roster: roster.length ? roster : staticBrainSnapshot().roster,
    assignments: assignments.length ? assignments : staticBrainSnapshot().assignments,
    notes,
  };
}

async function brainSnapshot() {
  const fallback = staticBrainSnapshot();
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), BRAIN_FETCH_MS);
    const res = await fetch(BRAIN_RAW, {
      signal: ac.signal,
      headers: { Accept: "text/plain", "User-Agent": "moonshadow-mission-control/0.1" },
    });
    clearTimeout(t);
    if (!res.ok) {
      return { ...fallback, fetchError: `HTTP ${res.status}`, live: false };
    }
    const md = await res.text();
    if (!md || md.length < 200 || !/STUDIO BRAIN/i.test(md)) {
      return { ...fallback, fetchError: "unexpected body", live: false };
    }
    return parseBrainMd(md);
  } catch (err) {
    return {
      ...fallback,
      fetchError: String(err.name === "AbortError" ? "timeout" : err.message || err),
      live: false,
    };
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  try {
    if ((url.pathname === "/health" || url.pathname === "/api/health") && req.method === "GET") {
      return json(res, 200, {
        ok: true,
        service: "moonshadow-mission-control",
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/roundtable" && req.method === "GET") {
      const state = loadState();
      const store = loadHandoffs();
      return json(res, 200, buildRoundtable(state, store.handoffs || []));
    }

    if (url.pathname === "/api/state" && req.method === "GET") {
      return json(res, 200, loadState());
    }

    if (url.pathname === "/api/brain-snapshot" && req.method === "GET") {
      return json(res, 200, await brainSnapshot());
    }

    if (url.pathname === "/api/events" && req.method === "GET") {
      const state = loadState();
      return json(res, 200, { events: state.events || [] });
    }

    if (url.pathname === "/api/events" && req.method === "POST") {
      const body = await readBody(req);
      const state = loadState();
      pushEvent(state, body.type || "note", body.message || "(empty)", {
        by: body.updatedBy || body.by || "operator",
      });
      state.updatedBy = body.updatedBy || body.by || "operator";
      return json(res, 201, saveState(state));
    }

    if (url.pathname === "/api/handoffs" && req.method === "GET") {
      return json(res, 200, loadHandoffs());
    }

    if (url.pathname === "/api/handoffs" && req.method === "POST") {
      const body = await readBody(req);
      const store = loadHandoffs();
      const name = String(body.name || "").trim();
      const assignmentId = String(body.assignmentId || "").trim();
      if (!name || !assignmentId) {
        return json(res, 400, { error: "name and assignmentId are required" });
      }
      const handoff = {
        id: `HO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: body.at || new Date().toISOString(),
        name,
        assignmentId,
        status: String(body.status || "").trim() || "REPORTED",
        completed: String(body.completed || "").trim(),
        evidence: String(body.evidence || "").trim(),
        tools: String(body.tools || "").trim(),
        verified: String(body.verified || "").trim(),
        remains: String(body.remains || "").trim(),
        blockers: String(body.blockers || "").trim(),
        nextAction: String(body.nextAction || "").trim(),
        joshDecisionRequired: body.joshDecisionRequired === true || body.joshDecisionRequired === "YES",
        joshDecisionNote: String(body.joshDecisionNote || "").trim(),
        by: body.updatedBy || body.by || "operator-ui",
      };
      store.handoffs.unshift(handoff);
      if (store.handoffs.length > 200) store.handoffs.length = 200;
      saveHandoffs(store);

      const state = loadState();
      pushEvent(
        state,
        "handoff",
        `${handoff.name} · ${handoff.assignmentId}: ${handoff.status}`,
        { handoffId: handoff.id, by: handoff.by }
      );
      state.updatedBy = handoff.by;
      saveState(state);

      return json(res, 201, { handoff, handoffs: store.handoffs });
    }

    if (url.pathname === "/api/missions" && req.method === "POST") {
      const body = await readBody(req);
      const state = loadState();
      const mission = {
        id: body.id || `MC-${String(state.missions.length + 1).padStart(3, "0")}`,
        owner: body.owner || "Josh",
        title: body.title || "Untitled mission",
        status: body.status || "ASSIGNED",
        evidence: body.evidence || "PENDING",
      };
      state.missions.unshift(mission);
      state.updatedBy = body.updatedBy || "operator";
      pushEvent(state, "mission.create", `Created ${mission.id}: ${mission.title}`, {
        missionId: mission.id,
        by: state.updatedBy,
      });
      return json(res, 201, saveState(state));
    }

    if (url.pathname.startsWith("/api/missions/") && req.method === "PATCH") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const body = await readBody(req);
      const state = loadState();
      const mission = state.missions.find((m) => m.id === id);
      if (!mission) return json(res, 404, { error: "mission not found" });
      const before = { status: mission.status, evidence: mission.evidence, owner: mission.owner, title: mission.title };
      if (body.status) mission.status = body.status;
      if (body.evidence) mission.evidence = body.evidence;
      if (body.owner) mission.owner = body.owner;
      if (body.title) mission.title = body.title;
      state.updatedBy = body.updatedBy || "operator";
      const parts = [];
      if (body.status && body.status !== before.status) parts.push(`status ${before.status} → ${body.status}`);
      if (body.evidence && body.evidence !== before.evidence) parts.push(`evidence updated`);
      if (body.owner && body.owner !== before.owner) parts.push(`owner → ${body.owner}`);
      if (body.title && body.title !== before.title) parts.push(`title updated`);
      pushEvent(state, "mission.update", `${id}: ${parts.join("; ") || "touched"}`, {
        missionId: id,
        by: state.updatedBy,
      });
      return json(res, 200, saveState(state));
    }

    if (url.pathname.startsWith("/api/crew/") && req.method === "PATCH") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const body = await readBody(req);
      const state = loadState();
      const person = state.crew.find((c) => c.id === id);
      if (!person) return json(res, 404, { error: "crew not found" });
      const beforePresence = person.presence;
      const beforeStatus = person.status;
      if (body.presence) person.presence = body.presence;
      if (body.status) person.status = body.status;
      state.updatedBy = body.updatedBy || "operator";
      const parts = [];
      if (body.presence && body.presence !== beforePresence) {
        parts.push(`presence ${beforePresence} → ${body.presence}`);
      }
      if (body.status && body.status !== beforeStatus) {
        parts.push(`status → ${body.status}`);
      }
      pushEvent(state, "crew.update", `${person.name}: ${parts.join("; ") || "touched"}`, {
        crewId: id,
        by: state.updatedBy,
      });
      return json(res, 200, saveState(state));
    }

    if (url.pathname.startsWith("/api/systems/") && req.method === "PATCH") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const body = await readBody(req);
      const state = loadState();
      const system = (state.systems || []).find((s) => s.id === id);
      if (!system) return json(res, 404, { error: "system not found" });
      const beforeStatus = system.status;
      if (body.status) system.status = body.status;
      if (body.home) system.home = body.home;
      if (body.name) system.name = body.name;
      state.updatedBy = body.updatedBy || "operator";
      const parts = [];
      if (body.status && body.status !== beforeStatus) {
        parts.push(`status ${beforeStatus} → ${body.status}`);
      }
      if (body.home) parts.push("home updated");
      if (body.name) parts.push("name updated");
      pushEvent(state, "system.update", `${system.name}: ${parts.join("; ") || "touched"}`, {
        systemId: id,
        by: state.updatedBy,
      });
      return json(res, 200, saveState(state));
    }

    if (url.pathname.startsWith("/api/sister-repos/") && req.method === "PATCH") {
      const name = decodeURIComponent(url.pathname.split("/").pop());
      const body = await readBody(req);
      const state = loadState();
      const repo = (state.sisterRepos || []).find((r) => r.name === name);
      if (!repo) return json(res, 404, { error: "sister repo not found" });
      const beforeStatus = repo.status;
      if (body.status) repo.status = body.status;
      if (body.role) repo.role = body.role;
      if (body.url) repo.url = body.url;
      state.updatedBy = body.updatedBy || "operator";
      const parts = [];
      if (body.status && body.status !== beforeStatus) {
        parts.push(`status ${beforeStatus} → ${body.status}`);
      }
      if (body.role) parts.push("role updated");
      if (body.url) parts.push("url updated");
      pushEvent(state, "sister-repo.update", `${repo.name}: ${parts.join("; ") || "touched"}`, {
        sisterRepo: name,
        by: state.updatedBy,
      });
      return json(res, 200, saveState(state));
    }

    if (url.pathname === "/api/sweep" && req.method === "POST") {
      const body = await readBody(req);
      const state = loadState();
      const store = loadHandoffs();
      const by = body.updatedBy || body.by || "operator-ui";
      const crew = state.crew || [];
      const missions = state.missions || [];
      const systems = state.systems || [];
      const repos = state.sisterRepos || [];
      const handoffs = store.handoffs || [];
      pushEvent(state, "sweep.crew", crew.map((c) => `${c.name}:${c.presence || "?"}`).join(", ") || "no crew", { by });
      pushEvent(state, "sweep.mission", missions.map((m) => `${m.id}:${m.status}`).join(", ") || "no missions", { by });
      pushEvent(state, "sweep.system", systems.map((s) => `${s.name}:${s.status}`).join(", ") || "no systems", { by });
      pushEvent(state, "sweep.sister-repo", repos.map((r) => `${r.name}:${r.status}`).join(", ") || "no sister repos", { by });
      pushEvent(state, "sweep.handoff", handoffs.slice(0, 8).map((h) => `${h.assignmentId}:${h.status}`).join(", ") || "none", { by });
      pushEvent(
        state,
        "sweep",
        `Front-to-back: ${crew.length} crew, ${missions.length} missions, ${systems.length} systems, ${repos.length} sister repos, ${handoffs.length} handoffs`,
        { by }
      );
      state.updatedBy = by;
      return json(res, 200, saveState(state));
    }

    if (url.pathname.startsWith("/api/")) {
      return json(res, 404, { error: "unknown api route" });
    }

    return serveStatic(res, url.pathname);
  } catch (err) {
    return json(res, 500, { error: String(err.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mission Control on http://${HOST}:${PORT}`);
});
