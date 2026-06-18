---
status: done
---

# Kimai time widget

Aggregated tracked time for the current week, broken down by the top N projects.

## Why

A quick "where did my hours go this week" glance without opening Kimai. Pairs with the todoist/github widgets — those are *what to do*, this is *what I already spent time on*. Self-hosted Kimai, so the same network/baseUrl caveats as the other self-hosted widgets apply (use the container's internal port over the shared docker network, not the host-published one).

## v1 scope

- New widget type: `kimai`. Schema in `src/lib/config.ts`, add to the discriminated union, new component, new `case` in `WidgetRenderer`.
- Config:
  - `baseUrl` (required — e.g. `http://kimai:8001`, internal container port)
  - `token` (required — Kimai API token)
  - `user` (optional — only for legacy `X-AUTH-USER`/`X-AUTH-TOKEN` auth on older Kimai; prefer Bearer)
  - `limit` (optional 1–10) — top N projects, default `5`
  - `weekStart` (optional `monday | sunday`) — default `monday` (ISO week)
  - `title` (optional)
- Server component, single render pass, `revalidate: 300`. Renders text only → no proxy route needed, token never leaves the server.

## Endpoints & auth

- Kimai 2.x: `Authorization: Bearer <token>`, `Accept: application/json`. (Legacy fallback: `X-AUTH-USER` + `X-AUTH-TOKEN` headers when `user` is set.)
- Pull this week's entries: `GET /api/timesheets?begin={isoStart}&end={isoNow}&size=1000` — returns the authenticated user's timesheets. Each row has `project` (id), `duration` (seconds), `begin`, `end`.
  - Watch pagination: the collection is paged (`X-Total-Count` header). `size` caps the page; loop pages if the week exceeds one page, or bump `size`.
  - Open (running) entries may have `duration: null` — compute `now - begin` for those, or skip.
- Map project id → name once via `GET /api/projects` (build an `id → {name, customer?}` map). The timesheet collection returns project as a bare integer, so we need this lookup. Optionally include customer name for disambiguation.

## Aggregation

- Compute the week boundary in the configured TZ (container `TZ`, e.g. Europe/Berlin), not UTC — Monday 00:00 local for ISO weeks. Be careful: `begin`/`end` query params want the server's expected format (`YYYY-MM-DDTHH:mm:ss`).
- Sum `duration` per project id, sort desc, take top `limit`.
- Keep a `total` (sum across *all* projects, not just the top N) and an "other" remainder so the bars/percentages stay honest when there are more projects than `limit`.

## Render

- One row per project: name (left), formatted duration (right, e.g. `4h 20m`).
- A proportional bar behind/under each row, scaled to the largest project's time (like the weather range bar).
- Footer line: total tracked this week, and `+N more` when projects were truncated.
- Empty state: "No time tracked this week."

## Per-theme treatment

- **Quartz** — project in tracked uppercase mono, duration tabular mono right-aligned, bar as a solid block.
- **Atrium** — project in muted Fraunces, duration italic, bar as a soft filled track.
- **Marginalia** — project in small-caps Source Serif, duration italic, hairline bar.

## Open questions

- Duration source: sum `duration` fields vs. a Kimai statistics/reporting endpoint. v1 sums timesheets (simple, one project map call); revisit if a native aggregate endpoint is cleaner.
- Multi-user: default scope is the token's own timesheets. Team-wide totals (`user=all`) need admin token + permission — out of scope for v1.
- Rounded vs. exact durations: Kimai can apply rounding rules server-side. We use whatever `duration` returns; note in docs it reflects Kimai's rounding, not raw.
- Failure modes: bad token / Kimai down → render a small `Kimai: <error>` line, don't crash the page (match the immich/edgewise widgets' inline error pattern).

## Don't forget

- Wire a configured instance into `config/dashboard.yaml` (not just the example) so it renders live, and document the widget in the example + README.
