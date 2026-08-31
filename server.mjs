import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3030);
const DATA = path.join(__dirname, "data");
const STATE = path.join(DATA, "state.json");
const SEED = path.join(DATA, "seed.json");
const PUBLIC = path.join(__dirname, "public");

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

function pushEvent(state, type, message, meta = {}) {
  if (!Array.isArray(state.events)) state.events = [];
  state.events.unshift({
    id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    type,
    message,
    ...meta,
  });
  // keep last 100
  if (state.events.length > 100) state.events.length = 100;
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

/** Read-only summary of studio-behind-the-cast/STUDIO_BRAIN.md.
 *  No live GitHub fetch (repo is private; no tokens stored here).
 *  Snapshot is curated from verified Brain content; does not rewrite the Brain.
 */
function brainSnapshot() {
  return {
    snapshotAt: new Date().toISOString(),
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
      { name: "Tigera", role: "Social Showrunner", status: "VERIFIED CHECK-IN", lane: "Social strategy, hooks, captions, community" },
      { name: "Slick", role: "Infrastructure / Publisher", status: "VERIFIED ACTIVE", lane: "Account readiness, packaging, release gate" },
      { name: "Artisa", role: "Master Visual Editor", status: "VERIFIED CHECK-IN", lane: "Fine cuts, pacing, continuity, visual masters" },
      { name: "The Scout", role: "Resource Acquisition", status: "REPORTED", lane: "Tools, terms, limits, privacy, expiration" },
      { name: "Role / Erole", role: "Audio Specialist", status: "NAME PENDING VERIFICATION", lane: "Audio treatment, music, voice, mix" },
    ],
    assignments: [
      { id: "SLI-001", owner: "Slick", title: "Read-only infrastructure and publishing-readiness audit", status: "ACTIVE", evidence: "Platform-by-platform evidence and official sources" },
      { id: "SLI-002", owner: "Slick", title: "Verify GitHub repository, branch, Brain path, and access", status: "ASSIGNED", evidence: "Remote read test of STUDIO_BRAIN.md" },
      { id: "TIG-001", owner: "Tigera", title: "Cock Dracula / Everyday Vampire launch plan", status: "ASSIGNED", evidence: "3 series, 5 hooks, 7-day schedule, 10 replies" },
      { id: "CD-001", owner: "Artisa", title: "Identify Cock Dracula source files, durations, and best takes", status: "ASSIGNED", evidence: "Source-media manifest" },
      { id: "AUDIO-001", owner: "Role / Erole", title: "Audio-role check-in and capability audit", status: "BLOCKED", evidence: "Exact displayed name and verified check-in" },
      { id: "BRAIN-001", owner: "Amber", title: "Establish canonical GitHub Studio Brain", status: "COMPLETE", evidence: "STUDIO_BRAIN.md on main" },
    ],
    notes: [
      "Do not merge Amber and Allie.",
      "Platform matrix (IG, FB, Threads, TikTok, YT, X) remains largely UNKNOWN — verify capability by capability.",
      "Handoff template lives in the Brain; Mission Control will add a matching form in a later slice.",
      "Sister systems: studio-behind-the-cast (Brain), moonshadow-studio-go (mobile creative room). Mission Control does not replace them.",
    ],
  };
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
    if (url.pathname === "/api/state" && req.method === "GET") {
      return json(res, 200, loadState());
    }

    if (url.pathname === "/api/brain-snapshot" && req.method === "GET") {
      return json(res, 200, brainSnapshot());
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

    if (url.pathname.startsWith("/api/")) {
      return json(res, 404, { error: "unknown api route" });
    }

    return serveStatic(res, url.pathname);
  } catch (err) {
    return json(res, 500, { error: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Mission Control on http://localhost:${PORT}`);
});
