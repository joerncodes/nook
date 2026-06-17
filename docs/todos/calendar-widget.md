---
status: open
---

# Calendar (ICS) widget

Upcoming events from one or more ICS URLs. Works with Google, iCloud, Nextcloud, Radicale, Fastmail — anything that exposes an ICS subscription URL.

## Why

The clock tells me the time; the calendar tells me what the time is *for*. ICS-as-source means a single widget covers every backend I'm likely to touch, with no per-provider OAuth dance.

## v1 scope

- New widget type: `calendar`. Schema in `src/lib/config.ts`.
- Config:
  - `sources` (required, array) — each: `{ url: string, label?: string, color?: string }`. Multiple URLs let me layer work + personal.
  - `limit` (optional 1–20) — default `5`
  - `days` (optional 1–60) — default `14`. Window: only events within the next `days` days.
  - `showAllDay` (optional bool) — default `true`
  - `title` (optional)
- Server component, single fetch per render, `revalidate: 600`.

## Parsing

- Add a small dependency: `ical.js` (battle-tested) or hand-roll a minimal parser (we already do XML parsing with `fast-xml-parser`, so adding `ical.js` is the lower-risk move).
- For each source: fetch, expand recurring events within the `[now, now+days]` window, sort by start, take first `limit` across all sources merged.
- Strip per-event timezone correctly — ICS DTSTART can be floating, UTC, or TZID-qualified. `ical.js` handles all three.

## Render

- Grouped by day, with day headings (`Today`, `Tomorrow`, `Wed 24 Jun`).
- Each event: time range (or `all-day`), title, source color dot in the gutter.
- Compact mode is fine — this widget should sit in a side column without dominating.

## Per-theme treatment

- **Quartz** — day headers in tracked uppercase mono, times in tabular mono, titles in regular mono. Source dot as a leading `▍`.
- **Atrium** — day headers in lowercase italic Fraunces with hairline rule beneath; times in light mono; titles in regular sans.
- **Marginalia** — day headers as small-caps Source Serif under a hairline; times in italic; source color as a margin rule.

## Open questions

- Caching: ICS files can be large (years of history). Set `revalidate: 600` but also consider conditional fetches (ETag / If-Modified-Since) — most CalDAV servers honor them.
- Privacy: ICS URLs are credentials in disguise (anyone with the URL reads the calendar). They live in `dashboard.yaml` which is already gitignored — call this out in `config/dashboard.example.yaml`.
- Recurrence edge cases: cancelled instances of recurring events (EXDATE, RECURRENCE-ID) — let `ical.js` handle and trust it.
- Time zone of display: server `TZ` env (in Docker) drives `new Date()` formatting. Document that for Portainer users.
- Click behaviour: most ICS providers don't have a stable web URL per event. Skip click-through in v1.
