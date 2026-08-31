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
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  return state;
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
      return json(res, 201, saveState(state));
    }

    if (url.pathname.startsWith("/api/missions/") && req.method === "PATCH") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const body = await readBody(req);
      const state = loadState();
      const mission = state.missions.find((m) => m.id === id);
      if (!mission) return json(res, 404, { error: "mission not found" });
      if (body.status) mission.status = body.status;
      if (body.evidence) mission.evidence = body.evidence;
      if (body.owner) mission.owner = body.owner;
      if (body.title) mission.title = body.title;
      state.updatedBy = body.updatedBy || "operator";
      return json(res, 200, saveState(state));
    }

    if (url.pathname.startsWith("/api/crew/") && req.method === "PATCH") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const body = await readBody(req);
      const state = loadState();
      const person = state.crew.find((c) => c.id === id);
      if (!person) return json(res, 404, { error: "crew not found" });
      if (body.presence) person.presence = body.presence;
      if (body.status) person.status = body.status;
      state.updatedBy = body.updatedBy || "operator";
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
