---
status: done
---

# Immich photo widget

A widget that surfaces a photo (or a small set) from a self-hosted Immich instance. The natural counterpart to the Unsplash widget, but for your own library — memories, recent uploads, or an album you curate as "wallpaper-grade."

## Why

The dashboard's typography is heavy; one good photo from my own library gives it a personal heartbeat. Immich has a "memories" feature ("on this day, three years ago") that's basically tailor-made for a homepage.

## Sketch

- New widget type: `immich`. Schema in `src/lib/config.ts`.
- Config:
  - `baseUrl` (required, e.g. `https://immich.my.domain`)
  - `apiKey` (required — generate at user settings → API Keys)
  - `source` (required, discriminated): `memories | album | random | search`
    - `memories` — daily "this day in past years" feed
    - `album: { id }` — pick a specific album as the pool
    - `random` — random asset from library, optionally constrained by `personId` / `isFavorite`
    - `search: { query }` — Immich smart-search query
  - `mode` (optional: `single | slideshow`) — default `single`. Slideshow rotates every N seconds (client-side useEffect).
  - `rotationSeconds` (optional, default 30) — only used in slideshow mode
  - `showCaption` (optional, default false) — render filename/people/location if available
  - `title` (optional, like other widgets)
- Server component fetches the chosen source via the Immich REST API.
- Endpoint examples (verify against the actual SDK):
  - `GET {baseUrl}/api/memories?for=today` → memories feed
  - `GET {baseUrl}/api/albums/{id}` → album assets
  - `GET {baseUrl}/api/search/random` → random asset(s)
- Auth header: `x-api-key: <apiKey>`
- Asset thumbnail URL: `{baseUrl}/api/assets/{assetId}/thumbnail?size=preview`

## Per-theme treatment

- **Quartz** — square crop, hairline frame, asset timestamp in tracked mono uppercase below: `2023.06.17 · 14:32`. Slight desaturation matches Readwise cover.
- **Atrium** — natural ratio, soft elevation, caption set lowercase italic Fraunces. "memory" mode shows the year prominently: *six years ago.*
- **Marginalia** — book-plate framing (matching Readwise cover treatment), caption in small-caps Source Serif with hairline above. EXIF date in italic.

## Open questions

- **CORS / network reachability**: dev typically runs Immich on the LAN. The dashboard server fetching `https://immich.lan/...` works; if the dashboard is deployed elsewhere, the Immich instance needs to be reachable from the dashboard host, not just the user's browser.
- **Image proxying vs. direct URLs**: if `<img src="{immichUrl}">` is used directly, the browser needs to be able to reach Immich AND have valid auth. Either: (a) proxy via a Next route handler (`/api/immich-thumb/:id`) that injects the api-key server-side, or (b) document that the dashboard must run on the same network. Option (a) is the safer default.
- **Caching strategy**: memories feed changes daily, individual asset thumbnails don't — long revalidate on the asset, short on the listing.
- **Faces / people**: Immich's memory feed surfaces "people you may know." Worth a small badge / hover-tooltip showing the people detected in the photo?
- **Slideshow client-side**: if `mode: slideshow`, the widget needs to be a Client Component (or have a tiny client island for rotation). Server component fetches the full pool of N assets, client component cycles.
- **Token storage**: same plaintext-in-yaml problem as Readwise / Todoist. Same eventual fix (`${env:IMMICH_API_KEY}` interpolation).
