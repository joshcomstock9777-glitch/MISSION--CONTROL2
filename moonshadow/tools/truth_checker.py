#!/usr/bin/env python3
"""Moonshadow Truth Checker: read-only verification with raw evidence.

Usage:
    python3 truth_checker.py --config truthcheck.json [--out ~/moonshadow/evidence]

Config (JSON):
{
  "name": "mission-control",
  "repos": [
    {"path": "/home/user/MISSION--CONTROL2",
     "commands": [{"label": "syntax", "cmd": "node --check server.mjs", "timeout": 60}]}
  ],
  "health_urls": [{"label": "local", "url": "http://127.0.0.1:3030/health", "expect_status": 200}]
}

Verdicts per check: PASS, FAIL, BLOCKED.
  - BLOCKED = could not be checked (missing path, tool, network denied, timeout).
  - A health URL on localhost / private network is reported with scope LOCAL_ONLY.
    Local success is never reported as a live deployment.

Read-only: git checks use read commands only. Configured test/build commands are
run exactly as written; the tool never adds commands of its own that write, push,
deploy or delete. Secrets: environment values are never printed or saved.
"""
import argparse
import datetime as dt
import ipaddress
import json
import os
import shlex
import socket
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

PASS, FAIL, BLOCKED = "PASS", "FAIL", "BLOCKED"


def now():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")


class Evidence:
    def __init__(self, root):
        self.root = root
        os.makedirs(root, exist_ok=True)
        self.n = 0

    def save(self, label, text):
        self.n += 1
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in label)[:60]
        path = os.path.join(self.root, f"{self.n:02d}_{safe}.txt")
        with open(path, "w") as f:
            f.write(text)
        return path


def run(cmd, cwd=None, timeout=60):
    """Run a command; return (exit_code or None on timeout/missing, combined output)."""
    try:
        p = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), capture_output=True,
                           text=True, timeout=timeout)
        return p.returncode, (p.stdout or "") + (p.stderr or "")
    except subprocess.TimeoutExpired as e:
        return None, f"TIMEOUT after {timeout}s\n{e.stdout or ''}{e.stderr or ''}"
    except FileNotFoundError as e:
        return None, f"NOT FOUND: {e}"


def strip_userinfo(text):
    out = []
    for line in text.splitlines():
        for scheme in ("https://", "http://"):
            if scheme in line and "@" in line.split(scheme, 1)[1].split("/", 1)[0]:
                head, rest = line.split(scheme, 1)
                line = head + scheme + rest.split("@", 1)[1]
        out.append(line)
    return "\n".join(out)


def check_repo(repo, ev):
    results = []
    path = os.path.expanduser(repo["path"])
    name = os.path.basename(path.rstrip("/"))
    if not os.path.isdir(os.path.join(path, ".git")):
        results.append({"check": f"{name}: git repo present", "verdict": BLOCKED,
                        "detail": f"no git repo at {path}"})
        return results

    git_reads = [
        ("branch", ["git", "branch", "--show-current"]),
        ("head", ["git", "log", "-1", "--format=%H %ad %an %s", "--date=iso"]),
        ("recent_commits", ["git", "log", "-10", "--format=%h %ad %s", "--date=short"]),
        ("status", ["git", "status", "--porcelain=v1"]),
        ("remotes", ["git", "remote", "-v"]),
        ("ahead_behind", ["git", "status", "-sb"]),
    ]
    out = {}
    for label, cmd in git_reads:
        code, text = run(cmd, cwd=path)
        text = strip_userinfo(text)
        out[label] = text.strip()
        ev.save(f"{name}_git_{label}", f"$ {' '.join(cmd)}\nexit: {code}\n\n{text}")

    dirty = [l for l in out["status"].splitlines() if l.strip()]
    results.append({"check": f"{name}: HEAD", "verdict": PASS, "detail": out["head"]})
    results.append({"check": f"{name}: working tree clean",
                    "verdict": PASS if not dirty else FAIL,
                    "detail": "clean" if not dirty else f"{len(dirty)} dirty: " + "; ".join(dirty[:10])})
    # Compare against the tracking branch, else origin/<branch>; never assume "pushed".
    branch = out["branch"]
    upstream = None
    for ref in ("@{upstream}", f"origin/{branch}"):
        code, _ = run(["git", "rev-parse", "--verify", "--quiet", ref], cwd=path)
        if code == 0:
            upstream = ref
            break
    if not branch or upstream is None:
        results.append({"check": f"{name}: commits pushed to remote", "verdict": BLOCKED,
                        "detail": f"no upstream or origin/{branch} ref to compare against"})
    else:
        code, text = run(["git", "rev-list", "--left-right", "--count", f"HEAD...{upstream}"], cwd=path)
        ev.save(f"{name}_git_vs_remote", f"$ git rev-list --left-right --count HEAD...{upstream}\nexit: {code}\n\n{text}")
        ahead, behind = (text.split() + ["?", "?"])[:2]
        results.append({"check": f"{name}: commits pushed to remote ({upstream})",
                        "verdict": PASS if ahead == "0" else FAIL,
                        "detail": f"ahead={ahead} behind={behind} (as of last fetch; remote not re-fetched)"})

    for c in repo.get("commands", []):
        code, text = run(c["cmd"], cwd=path, timeout=c.get("timeout", 300))
        f = ev.save(f"{name}_cmd_{c['label']}", f"$ {c['cmd']}\ncwd: {path}\nexit: {code}\n\n{text}")
        if code is None:
            verdict = BLOCKED
        else:
            verdict = PASS if code == 0 else FAIL
        results.append({"check": f"{name}: command '{c['label']}'", "verdict": verdict,
                        "detail": f"exit={code}; evidence={os.path.basename(f)}"})
    return results


def url_scope(url):
    host = urllib.parse.urlparse(url).hostname or ""
    if host in ("localhost",) or host.endswith(".local") or host.endswith(".internal"):
        return "LOCAL_ONLY"
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(host))
        if ip.is_loopback or ip.is_private or ip.is_link_local:
            return "LOCAL_ONLY"
    except (socket.gaierror, ValueError):
        return "UNRESOLVED"
    return "PUBLIC"


def check_url(h, ev):
    url, expect = h["url"], h.get("expect_status", 200)
    scope = url_scope(url)
    label = h.get("label", url)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "moonshadow-truth-checker"})
        with urllib.request.urlopen(req, timeout=h.get("timeout", 10)) as r:
            status, body = r.status, r.read(4000).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        status, body = e.code, e.read(4000).decode("utf-8", "replace")
    except Exception as e:  # network denied, refused, DNS, timeout
        f = ev.save(f"url_{label}", f"GET {url}\nscope: {scope}\nERROR: {e!r}")
        refused = "refused" in str(e).lower()
        return {"check": f"health '{label}' [{scope}]", "verdict": FAIL if refused else BLOCKED,
                "detail": f"{type(e).__name__}: {e}; evidence={os.path.basename(f)}"}
    f = ev.save(f"url_{label}", f"GET {url}\nscope: {scope}\nstatus: {status}\n\n{body}")
    ok = status == expect
    if ok and scope == "LOCAL_ONLY":
        note = "reachable LOCALLY only; this is NOT evidence of a live public deployment"
    elif ok:
        note = "publicly reachable at time of check"
    else:
        note = f"expected {expect}"
    return {"check": f"health '{label}' [{scope}]", "verdict": PASS if ok else FAIL,
            "detail": f"status={status}; {note}; evidence={os.path.basename(f)}"}


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", default=os.path.expanduser("~/moonshadow/evidence"))
    a = ap.parse_args()
    cfg = json.load(open(os.path.expanduser(a.config)))
    run_dir = os.path.join(os.path.expanduser(a.out), f"{cfg.get('name', 'check')}-{now()}")
    ev = Evidence(run_dir)

    results = []
    for repo in cfg.get("repos", []):
        results += check_repo(repo, ev)
    for h in cfg.get("health_urls", []):
        results.append(check_url(h, ev))

    verdicts = {r["verdict"] for r in results}
    overall = FAIL if FAIL in verdicts else BLOCKED if BLOCKED in verdicts else PASS
    live_claim = any(r["verdict"] == PASS and "[PUBLIC]" in r["check"] for r in results)

    report = {"name": cfg.get("name"), "at": now(), "overall": overall,
              "public_deployment_verified": live_claim, "results": results,
              "evidence_dir": run_dir}
    json.dump(report, open(os.path.join(run_dir, "report.json"), "w"), indent=2)
    lines = [f"# Truth Check: {cfg.get('name')}", "", f"- At: {report['at']}",
             f"- **Overall: {overall}**",
             f"- Public deployment verified: **{'YES' if live_claim else 'NO'}**",
             f"- Evidence: `{run_dir}`", "", "| Verdict | Check | Detail |", "|---|---|---|"]
    lines += [f"| {r['verdict']} | {r['check']} | {r['detail'].replace('|', '/')} |" for r in results]
    md = "\n".join(lines) + "\n"
    open(os.path.join(run_dir, "report.md"), "w").write(md)
    print(md)
    sys.exit({PASS: 0, FAIL: 1, BLOCKED: 2}[overall])


if __name__ == "__main__":
    main()
