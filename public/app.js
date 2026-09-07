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
const BUILD = "2026-09-07-d";
// truncated for test - full content needed
