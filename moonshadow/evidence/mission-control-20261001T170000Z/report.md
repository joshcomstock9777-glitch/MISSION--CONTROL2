# Truth Check: mission-control

- At: 20261001T170001Z
- **Overall: BLOCKED**
- Public deployment verified: **NO**
- Evidence: `/root/moonshadow/evidence/mission-control-20261001T170000Z`

| Verdict | Check | Detail |
|---|---|---|
| PASS | MISSION--CONTROL2: HEAD | fa9ea8903977d801450c3181c8e03c664433d6ff 2026-10-01 12:05:08 -0400 josh co Log 2026-10-01 12:02 EDT stand-down check-in. No app changes. |
| PASS | MISSION--CONTROL2: working tree clean | clean |
| PASS | MISSION--CONTROL2: commits pushed to upstream | ## ccr-4265aefb-p5nnu1 |
| PASS | MISSION--CONTROL2: command 'syntax-server' | exit=0; evidence=07_MISSION--CONTROL2_cmd_syntax-server.txt |
| PASS | MISSION--CONTROL2: command 'syntax-app' | exit=0; evidence=08_MISSION--CONTROL2_cmd_syntax-app.txt |
| PASS | MISSION--CONTROL2: command 'seed-json-valid' | exit=0; evidence=09_MISSION--CONTROL2_cmd_seed-json-valid.txt |
| PASS | health 'local-3030' [LOCAL_ONLY] | status=200; reachable LOCALLY only; this is NOT evidence of a live public deployment; evidence=10_url_local-3030.txt |
| BLOCKED | health 'fly-public' [PUBLIC] | URLError: <urlopen error Tunnel connection failed: 403 Forbidden>; evidence=11_url_fly-public.txt |
| BLOCKED | health 'render-public' [PUBLIC] | URLError: <urlopen error Tunnel connection failed: 403 Forbidden>; evidence=12_url_render-public.txt |
