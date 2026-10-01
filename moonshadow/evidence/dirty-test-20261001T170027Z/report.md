# Truth Check: dirty-test

- At: 20261001T170027Z
- **Overall: FAIL**
- Public deployment verified: **NO**
- Evidence: `/root/moonshadow/evidence/dirty-test-20261001T170027Z`

| Verdict | Check | Detail |
|---|---|---|
| PASS | sandbox-dirty: HEAD | 5967502c38e866f1e60638a8c613377ac98d9c2f 2026-10-01 17:00:10 +0000 t init |
| FAIL | sandbox-dirty: working tree clean | 1 dirty: ?? untracked.txt |
| BLOCKED | sandbox-dirty: commits pushed to remote | no upstream or origin/master ref to compare against |
| FAIL | sandbox-dirty: command 'fails' | exit=3; evidence=07_sandbox-dirty_cmd_fails.txt |
