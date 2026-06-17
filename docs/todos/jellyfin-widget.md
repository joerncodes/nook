---
status: in-progress
---

# Jellyfin library widget

A small widget that reports on a self-hosted Jellyfin instance — library health-check style. Two counts plus the latest movie's poster as the visual anchor.

## Why

Two stats give a felt sense of the library's size at a glance. The poster of whatever I just added is a nicer reminder of *what's new* than a text line — and it doubles as the click-target into Jellyfin.

## v1 scope

- New widget type: `jellyfin`. Schema in `src/lib/config.ts`.
- Config:
  - `baseUrl` (required, e.g. `https://jellyfin.my.domain`)
  - `apiKey` (required — Dashboard → API Keys)
  - `userId` (required — Jellyfin counts are scoped to a user; grab via `GET /Users` or from the Dashboard)
  - `title` (optional)
- Server component, single fetch per render with sensible revalidate.
- Renders:
  - Two numbers: total movies, total episodes.
  - The poster image for the most recently added movie, with title + year as caption below or beside it.
  - Click-through opens the movie in the Jellyfin web UI.

## Endpoints (to verify)

- Movie count: `GET /Items?userId={uid}&IncludeItemTypes=Movie&Recursive=true&Limit=0` → use the `TotalRecordCount` field from the response.
- Episode count: `GET /Items?userId={uid}&IncludeItemTypes=Episode&Recursive=true&Limit=0` → same shape.
- Latest movie: `GET /Users/{uid}/Items/Latest?IncludeItemTypes=Movie&Limit=1` → returns the most recent movie.
- Poster image: `GET /Items/{itemId}/Images/Primary?maxHeight=400` (or similar).
- Auth: `X-Emby-Token: <apiKey>` header (Jellyfin accepts both `X-MediaBrowser-Token` and `X-Emby-Token`; check current docs).

## Per-theme treatment

- **Quartz** — counts in tabular mono with eyebrow labels (`MOVIES 814   EPISODES 12,403`). Poster with hairline frame + slight desaturation. Reuse the Readwise cover finish.
- **Atrium** — counts in light italic Fraunces, big and unbordered, with the poster softly shadow-elevated to the right or below. Caption lowercase italic.
- **Marginalia** — counts set as small-caps Source Serif with hairline rule; poster in the book-plate frame (matching Readwise + Immich tile finish). Caption in italic.

## Open questions

- **Layout direction**: poster left + counts/caption right, or counts on top and poster below? Probably theme-dependent. Quartz reads better with counts on top (instrument register), Atrium and Marginalia probably want the poster as the focal point with stats underneath.
- **What counts as the "image"**: poster (default) or `backdrop` (cinematic still)? Poster is safer — recognizable shape, fits a narrow column.
- **Caching**: counts change slowly, poster doesn't change at all once added. `revalidate: 3600` is probably fine.
- **Proxy**: same problem as Immich — the API key shouldn't leak to the browser. Reuse the `/api/jellyfin/...` proxy pattern (or generalise the Immich one into a shared `/api/proxy/[provider]/[id]/thumb`).
- **Multi-user libraries**: only the configured `userId` is counted. That's fine for a personal dashboard. Family setups would need per-user widgets.
- **TV shows vs episodes**: do I want a third number for TV shows (series count) or stick to two? Two is cleaner. Movies + episodes already tell the story.

## Future (not v1)

- Carousel through the N most recent additions (movies + shows), reusing the Immich crossfade.
- "Continue watching" feed via `GET /Users/{uid}/Items/Resume`.
- Currently-playing live tile if any session is active (`GET /Sessions`).
- Watch-time / play-count stats (Jellyfin has playback reporting endpoints).
