# Deploy Mission Control

Josh approved a public deploy on 2026-09-03.
This repo is a Node process with a JSON file store. GitHub Pages cannot host the API.
No secrets belong in this repo.

## Local (already works)

```bash
node server.mjs
```

Open http://localhost:3030  
Health: http://localhost:3030/health

## Render (recommended one-click)

1. Sign in at https://render.com with the GitHub account that owns this repo.
2. New → Blueprint, pick `joshcomstock9777-glitch/MISSION--CONTROL2`.
3. Apply `render.yaml`. Free web service is enough.
4. After first deploy, the public URL is the operator surface for Android.

File store (`data/state.json`, `data/handoffs.json`) lives on the instance disk. Free Render disks reset on some deploys — treat that as known, not a secret store.

## Docker

```bash
docker build -t moonshadow-mission-control .
docker run --rm -p 3030:3030 moonshadow-mission-control
```

## What is NOT live until the host exists

- No public URL yet from this repo alone.
- No tokens stored here.
- Sister systems stay separate: `studio-behind-the-cast`, `moonshadow-studio-go`.
