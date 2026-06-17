---
status: open
---

# Linkwarden widget

Recent saves from a self-hosted Linkwarden instance + a search field with autocomplete over the user's full library.

## Why

A read-later pile that lives outside the browser tab graveyard, plus instant recall: the moment you remember "I saved something about X" you can type it without leaving the homepage. The recent list keeps fresh saves visible; the search makes the rest reachable in two keystrokes.

## v1 scope

- New widget type: `linkwarden`. Schema in `src/lib/config.ts`.
- Config:
  - `baseUrl` (required, e.g. `https://linkwarden.my.domain`)
  - `token` (required — Linkwarden: Settings → Access Tokens)
  - `collectionId` (optional, number) — scope to a single collection
  - `tagId` (optional, number) — scope to a single tag
  - `limit` (optional 1–20) — default `8` — recent-saves list length
  - `search` (optional bool) — default `true` — show the search field above the list
  - `searchPlaceholder` (optional string) — default `Search bookmarks…`
  - `title` (optional)
- Server component for the recent list (single fetch per render, `revalidate: 600`).
- Client component for the search input + results dropdown.

## Endpoints

- Auth: `Authorization: Bearer <token>` header.
- Recent: `GET /api/v1/links?sort=0&limit={limit}` (sort 0 = newest first). Add `&collectionId=` / `&tagId=` when configured. Response: `{ response: [...links] }`.
- Search: `GET /api/v1/links?searchQueryString={q}&limit=8` (Linkwarden's search matches name, description, URL, and tags). Same scoping params apply.
- Each link has `name`, `url`, `description`, `createdAt`, `collection: { name, color }`, `tags[]`.

## Render

### Recent list (server-rendered)

- N items: favicon (`https://icons.duckduckgo.com/ip3/{host}.ico` — already an allowed remote pattern in `next.config.ts`), title, host underneath.
- Color dot from `link.collection.color` in the gutter — matches Linkwarden's own UI cue.
- Click → opens the original URL in a new tab.

### Search field (client-side, above the list)

- Search input styled to match the existing `search` widget — same height, same border, same focus ring. Reuse those tokens so the dashboard feels coherent.
- Keyboard: `/` focuses (skip when already typing in another input); `Esc` clears and blurs; `↑`/`↓` move through suggestions; `Enter` opens the highlighted item (or the first one) in a new tab.
- Debounced 200 ms; minimum 2 characters before firing.
- Autocomplete dropdown overlays the recent list (or pushes it down — try overlay first, it keeps page height stable).
- Each suggestion row: favicon, title, host, collection color dot. Same row shape as the recent list to avoid visual whiplash.
- Empty-result state: muted "no matches" line, no dropdown chrome.

## Proxy route (required for search — token must not leak)

- Add `src/app/api/linkwarden/search/route.ts`:
  - `GET /api/linkwarden/search?q=...`
  - Loads config, finds the `linkwarden` widget (same scan as the Immich proxy route), proxies to upstream `GET /api/v1/links?searchQueryString=...` with the `Authorization: Bearer` header server-side.
  - Returns a trimmed JSON shape (`{ id, name, url, host, collectionColor }[]`) — never the raw upstream response.
  - `cache-control: no-store` — search results are query-dependent and personal.
- Same pattern as `src/app/api/immich/[id]/thumb/route.ts` for the credential lookup.

## Per-theme treatment

- **Quartz** — favicon + mono title + tracked-uppercase host. Collection dot as a leading `▍` glyph tinted to the collection color. Search field with hairline border + mono placeholder.
- **Atrium** — light italic Fraunces title, lowercase italic host, color dot as a small filled circle in the gutter. Search field borderless with soft underline + italic placeholder.
- **Marginalia** — small-caps Source Serif title under a hairline, host in italic, collection color as a margin rule. Search field set as a serif inset with a hairline rule beneath.

## Open questions

- API stability: Linkwarden's `/api/v1/` has been moving — pin to whatever version the user's deployment runs, document min version in the widget schema comment.
- Multiple scopes: collection AND tag together — Linkwarden allows it via query params; pass both through to both recent and search calls.
- Open-in-app vs open-original: default original. A future `openIn: original | linkwarden` flag could swap.
- `/` keybinding collision: the existing `search` widget might also want `/`. If both are present, the first-mounted wins; consider a `hotkey` config (`/`, `b`, none) to opt out.
- Search ranking: Linkwarden returns matches but ordering isn't documented strongly — if results feel arbitrary, fall back to scoring locally (exact-name match > host match > tag match > description match).
- Mobile/touch: focus-on-`/` is desktop-only; the input is still tappable. No special-casing needed in v1.
