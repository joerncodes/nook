# nook

Personal browser-homepage dashboard. Big central column for the things you use constantly (clock, search) plus a configurable number of side columns of widgets, all driven by a YAML file.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 + shadcn/ui
- YAML config validated by Zod
- Docker (standalone output) for Portainer

## Configure

Copy `config/dashboard.example.yaml` to `config/dashboard.yaml` and edit it.
The real `dashboard.yaml` is gitignored — it holds API tokens — so each install keeps its own copy.

Example shape:

```yaml
title: nook

center:
  - type: greeting
    name: Jörn
  - type: clock
    format24h: true
  - type: search
    engine: duckduckgo

columns:
  - widgets:
      - type: links
        title: Dev
        items:
          - title: GitHub
            url: https://github.com
  - widgets:
      - type: rss
        title: HN Front Page
        url: https://hnrss.org/frontpage
        limit: 8
```

### Widget types

See **[docs/widgets.md](docs/widgets.md)** for the full reference — every widget, every option, with defaults and examples.

At a glance: `greeting`, `clock`, `search`, `links`, `note`, `rss`, `weather`, `calendar`, `todoist`, `readwise`, `linkwarden`, `immich`, `jellyfin`, `kimai`, `edgewise`.

All widgets accept an optional `title`. The number of side columns is whatever you put under `columns:`.

The config path defaults to `./config/dashboard.yaml` and can be overridden with the `CONFIG_PATH` env var.

### Editing the config from the dashboard

A pencil button (next to the light/dark toggle, top-right) opens an in-app editor for `dashboard.yaml`. Saving validates against the schema, writes a `.bak` next to the file, and reloads the page.

Because this is a **write endpoint with no auth**, it's **off by default in production** and must be opted into with `NOOK_CONFIG_EDIT=true` — only do so behind a trusted network (Tailscale, auth proxy). It's always on under `pnpm dev`. Two requirements for it to work in a container:

- Set `NOOK_CONFIG_EDIT=true`.
- Mount the config **writable** — drop the `:ro` from the volume (`-v "$PWD/config:/config"`), or saves will fail.

## Develop

```bash
pnpm install
pnpm dev
```

## Build & run with Docker

```bash
docker build -t nook .
docker run --rm -p 3000:3000 -v "$PWD/config:/config:ro" nook
```

## Deploy to Portainer

1. Push a built image (`docker build -t ghcr.io/<you>/nook:latest . && docker push …`) or build locally on the Portainer host.
2. In Portainer → Stacks → Add stack, paste `docker-compose.yml` (or point it at this repo).
3. Set env vars (`GHCR_OWNER`, `NOOK_PORT`, `TZ`) in the stack UI.
4. Mount your `dashboard.yaml` at `/config/dashboard.yaml` — either via a Portainer-managed bind mount, a named volume, or by committing the config alongside the stack.
5. Deploy. The container exposes port 3000 with a healthcheck on `/`.

Changes to `dashboard.yaml` are picked up on the next request — no rebuild needed (the page is `force-dynamic`).
