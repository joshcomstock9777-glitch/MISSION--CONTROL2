# Moonshadow Roundtable — Design (NOT ACTIVATED)

Status: **design only.** No code in this folder calls any AI provider. Nothing is wired to keys.
Activation requires Josh's separate approval (it spends money).

## Purpose

Replace Josh hand-carrying packets between AIs. One question goes in, named seats answer in
turn under hard limits, and Josh moderates and makes the final call. Everything is saved.

## Seats

Each seat is one model, under its own name. A seat may only speak as itself.

| Seat | Provider | Model env var | Key env var | Default role |
|---|---|---|---|---|
| `josh` | human | — | — | **Moderator.** Opens, approves continuation, closes. Only seat that can decide. |
| `claude` | Anthropic | `RT_CLAUDE_MODEL` | `ANTHROPIC_API_KEY` | Builder / analyst |
| `chatgpt` | OpenAI | `RT_OPENAI_MODEL` | `OPENAI_API_KEY` | Second opinion / Codex hand-off |
| `grok` | xAI | `RT_GROK_MODEL` | `XAI_API_KEY` | Contrarian / devil's advocate |

Seats are config, not code. Add, remove or disable them in `roundtable.config.example.json`.
Crew personas (Amber, Allie, Artisa, Slick) can be layered on as *role prompts*, but the transcript
always shows the **real provider and model** beside the persona name. A persona never hides which model is talking.

## Session flow

```
Josh asks SOURCE QUESTION
  └─> saved verbatim, hashed (sha256), pinned at top of every prompt
Round 1: each enabled seat answers in fixed order
  └─> checks: budget, turn cap, loop guard
Josh gate: [continue] [redirect with note] [end]
Round 2..N: each seat sees the question + prior turns (trimmed to context budget)
Close: one summary seat writes "Positions / Agreements / Open questions"
  └─> Josh writes the decision (only a human can mark DECIDED)
```

**Default: Josh approves every round.** An auto-continue option exists in config but is off, and capped at 1 auto round.

## Limits (hard stops; any one ends the session)

| Limit | Default | Notes |
|---|---|---|
| `max_rounds` | 3 | Full passes around the table |
| `max_turns_total` | 9 | Across all seats |
| `max_output_tokens_per_turn` | 800 | Sent to each provider |
| `max_usd_per_session` | 1.00 | Estimated *before* each call from token counts × configured price; the call is refused if it would cross the cap |
| `max_usd_per_day` | 3.00 | Tracked in `spend-ledger.jsonl` |
| `turn_timeout_s` | 90 | A timed-out turn is recorded as `TIMEOUT`, not retried silently |
| `max_retries_per_turn` | 1 | |

Prices live in config (`price_per_1k_input/output`) because they change; the tool never guesses them.
Missing price means the seat is refused (fail closed).

## Loop protection

1. **Turn and round caps** (above). They can't be overridden mid-session.
2. **Repetition guard:** if a turn's normalized text is >85% similar (token Jaccard) to any earlier turn by the same seat, mark it `LOOP` and skip that seat for the rest of the round.
3. **Echo guard:** a seat that mostly quotes another seat (>70% overlap) gets flagged `ECHO`.
4. **No self-triggering:** seats can't call the roundtable, other seats, tools, or URLs. Output is text only.
5. **Stalemate stop:** two consecutive rounds with no new claims (all `LOOP`/`ECHO`) ends the session and hands back to Josh.

## No impersonation

- Each turn is stamped server-side with `{seat, provider, model, request_id}` from the API response, never from model text.
- The system prompt to each seat says: *"You are {seat} ({provider}). Speak only as yourself. Do not write lines for other participants or for Josh."*
- Output filter: lines starting with another seat's name plus a colon (e.g. `grok:`, `Josh:`) get flagged `IMPERSONATION`, and the turn is quarantined (saved, not shown to other seats).
- Only the `josh` seat can be entered from the keyboard. Model output can never be recorded as Josh.

## Transcript

Saved to `~/moonshadow/roundtable/sessions/<UTC timestamp>-<slug>/`:

- `question.md`: source question, verbatim, plus sha256. Never edited.
- `transcript.jsonl`: one line per turn: `ts, round, seat, provider, model, request_id, input_tokens, output_tokens, est_usd, flags[], text`.
- `transcript.md`: human-readable render.
- `summary.md`: close-out, plus Josh's decision.
- `limits.json`: limits in force and which one ended the session.

Append-only while running. A session is never rewritten after close.

## Secrets

- Keys are read **only** from environment variables named in config (`key_env`). Never from files, the transcript, or chat.
- A missing key disables that seat with status `BLOCKED: <ENV_NAME> not set`. The name is printed, never a value.
- Request and response logs strip `Authorization` / `x-api-key` headers before saving.
- `.gitignore` covers `sessions/` and `spend-ledger.jsonl` by default. Josh opts in to committing a transcript.

## Activation checklist (needs Josh)

1. Pick seats and models. Fill `roundtable.config.example.json` → `roundtable.config.json`.
2. Add keys as environment secrets on the machine that will run it (not in chat, not in a repo).
3. Approve the spend caps.
4. Approve building the runner: about 300 lines of Python, stdlib plus each provider's official SDK.
5. First run: dry-run mode (`--dry-run` prints the prompts and cost estimates, makes zero API calls). Then one live 1-round test.
