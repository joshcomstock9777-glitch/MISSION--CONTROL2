# System Inventory — Mission 001

Generated: 2026-10-01 (UTC) by Claude Code terminal worker.
Raw evidence for every line below: `~/moonshadow/operator-reports/command-log.md`.

> **Scope warning:** this is the **Claude Code cloud container**, not Josh's phone or PC.
> It is ephemeral: `~/moonshadow/` is deleted when the session is reclaimed unless
> Josh approves copying it into a repo branch and pushing.

## Machine

| Item | Value |
|---|---|
| OS | Ubuntu 24.04.4 LTS, Linux 6.18 x86_64 |
| Disk | 30G available of per-session allowance (`df` shows 252G volume, 8.4G used) |
| Home | `/root` (1.4G used) |
| Repo checkout | `/home/user/MISSION--CONTROL2` |

## Runtimes

| Runtime | Version |
|---|---|
| node / npm / npx | v22.22.0 / 10.9.4 / 10.9.4 |
| bun | 1.3.14 |
| python3 / pip3 | 3.11.15 / 24.0 |
| go | 1.24.7 |
| rustc / cargo | 1.97.0 |
| java | OpenJDK 21.0.11 |
| ruby | 3.3.6 |
| php | 8.3.6 |
| docker | 29.6.2 (client) |
| git / gh | 2.43.0 / 2.89.0 |
| deno | not installed |

## CLI tools

Present: curl, wget, jq, rg, psql, redis-cli, ffmpeg, make, gcc, zip/unzip, tar, vim, nano, tmux, gcloud, bq, gsutil, Playwright Chromium (`/opt/pw-browsers`).
Missing: fd, sqlite3, yt-dlp, ssh, rsync, aws, vercel, railway, flyctl, render.

## GitHub authentication

- `gh auth status`: **logged in, active account on github.com** (token lines stripped from log).
- Git access goes through the session's git proxy; no git credential helper is configured.
- **This session only has access to `MISSION--CONTROL2`.** Private repos fail with
  `could not read Username ... terminal prompts disabled`. Public repos are readable.

## Repositories

### Local (cloned in this container)

| Repo | Path | Current branch | Local branches | Remote | Dirty files | Latest commit |
|---|---|---|---|---|---|---|
| MISSION--CONTROL2 | `/home/user/MISSION--CONTROL2` | `ccr-4265aefb-p5nnu1` | `ccr-4265aefb-p5nnu1`, `main` | `origin` → github.com/joshcomstock9777-glitch/MISSION--CONTROL2 | **none** | `fa9ea89` 2026-10-01 12:05 -0400 "Log 2026-10-01 12:02 EDT stand-down check-in. No app changes." |

Other `.git` dirs on disk are tool installs (rbenv, nvm, uv cache), not Moonshadow repos.

### GitHub account `joshcomstock9777-glitch` (17 repos, read via `git ls-remote`, nothing cloned)

| Repo | Visibility | Branches (head SHA) |
|---|---|---|
| MISSION--CONTROL2 | public | `main` fa9ea89, `flyio-new-files` d292979 |
| moonshadow-headquarters | public | **70 branches** (mostly `amber/*`) |
| moonshadow-studio-go | public | **55 branches** (`cassandra/*`, `ellie/*`, `codex/*`) |
| studio-behind-the-cast | public | **33 branches** (`agent/*`, `copilot/*`, `allie/*`, `codex/*`) |
| moonshadow-renderer | public | `main` 406d804, `flyio-new-files` 088185f |
| moonshadow-feild-opps | public | `main` d8824ab, `copilot/add-field-ops-folder` 6b29de9 |
| content-mill | public | `main` 5dc7044 |
| Moon-Shadow-studios | public | `main` 4106029 |
| Big-City- | public | `main` 1109f37, `copilot/resume-work-from-where-left-off` 1109f37, `ona/devcontainer-setup` 30e2d3a |
| moonshadow-quill | private | BLOCKED (no session access) |
| velvet-room | private | BLOCKED |
| local-studio | private | BLOCKED |
| moonshadow-cutter | private | BLOCKED |
| moonshadow-creative-os | private | BLOCKED |
| three-mind-studio | private | BLOCKED |
| openai-gpt-slackbot-vercel-functions | private | BLOCKED |
| Mission-Control | private | BLOCKED |

Dirty files / latest commit messages for remote-only repos: not knowable without cloning (not done; read-only map only).

## Environment variables (names only)

Full list in command log. Relevant facts:

- Present: `GH_TOKEN`, `GITHUB_TOKEN`, `HTTPS_PROXY`, `CLOUDSDK_AUTH_ACCESS_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (container-provided; values never read).
- **Absent:** `YOUTUBE_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`.

## Immediate blockers

1. **`signal_sweep.py` is not present anywhere on this machine** (full filesystem search). Needs Josh to provide it.
2. **No AI-provider or YouTube API keys in this environment.** Signal Sweep's limited test and any live roundtable can't run here until keys are added as environment secrets (names only, never pasted into chat).
3. **Private repos are inaccessible** to this session (8 of 17).
4. **Ephemeral storage:** reports vanish when the session ends unless approved for commit + push.
5. **Branch sprawl:** 158 branches across 3 repos. Not a blocker, but a cleanup candidate.
