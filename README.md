# Mission Control

Operator layer for Moonshadow Studio.

This repo is the command surface. It does not replace:

- `studio-behind-the-cast` — Studio Brain / PATH / memory
- `moonshadow-studio-go` — mobile creative room

Mission Control sits above both. It tracks crew, missions, blockers, linked systems, and what needs a Josh decision.

## Rules locked from the Brain

- Verify, do not assume.
- If it is not recorded, it did not happen.
- Never store secrets here.
- Josh approves publish, spend, delete, and external access.
- Amber routes. Allie creates. Artisa gates quality. Slick ships.

## Run local

```bash
node server.mjs
```

Open http://localhost:3030

No install required. Node 18+.

## Layout

```
data/           seed state (crew, missions, systems)
public/         operator dashboard
server.mjs      local API + static host
docs/           operating notes
```

## Status

Foundation. Local JSON store. Seeded with verified Brain roster and current assignment IDs.
