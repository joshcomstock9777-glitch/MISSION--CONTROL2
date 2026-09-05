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

Health: http://localhost:3030/health

No install required. Node 18+.

## Deploy

See `docs/DEPLOY.md`. Blueprint: `render.yaml`. Container: `Dockerfile`.

A public URL requires connecting this GitHub repo to a host (Render recommended). That click lives on Josh's account.

## Layout

```
data/           seed state (crew, missions, systems)
public/         operator dashboard
server.mjs      local API + static host
docs/           operating notes
```

## Status

Operator dashboard A–F shipped. Live refresh, mission filter, Copy Brain MD helper shipped. Deploy-ready. Public host not live until Render/Fly is connected.
