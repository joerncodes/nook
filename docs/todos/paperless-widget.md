---
status: open
---

# Paperless-ngx inbox widget

Recent / inbox documents from a self-hosted Paperless-ngx instance, with thumbnails.

## Why

Paperless lives behind a tag-based inbox workflow ("untagged" = needs filing). A glanceable count + the last few thumbnails turns "did anything new arrive?" into something I notice without opening the app.

## v1 scope

- New widget type: `paperless`. Schema in `src/lib/config.ts`.
- Config:
  - `baseUrl` (required, e.g. `https://paperless.my.domain`)
  - `token` (required — Paperless: Settings → API tokens)
  - `mode` (optional: `inbox | recent`) — default `inbox`. `inbox` filters by the configured inbox tag(s); `recent` is just most-recently-added.
  - `limit` (optional 1–20) — default `5`
  - `title` (optional)
- Server component, single fetch per render, `revalidate: 300`.

## Endpoints

- Auth: `Authorization: Token <token>` header.
- Documents: `GET /api/documents/?ordering=-created&page_size={limit}` (recent) or `&is_in_inbox=true` (inbox). Response is paginated DRF (`results[]`, `count`).
- Thumbnail: `GET /api/documents/{id}/thumb/` — binary, auth-required.
- Open in UI: `{baseUrl}/documents/{id}/`.

## Render

- Header: total inbox count (or "recent N").
- List of N items: small thumbnail, title (Paperless `title` field), correspondent + date in a sub-line.
- Click → opens the document in the Paperless web UI in a new tab.

## Proxy route (required — token must not leak)

- Add `src/app/api/paperless/[id]/thumb/route.ts` mirroring the Immich proxy:
  - Look up the `paperless` widget in `cfg.center + cfg.columns.flatMap(...)`.
  - Fetch upstream with the `Authorization: Token` header.
  - Stream the body back with `cache-control: public, max-age=86400, immutable`.
- Add a `src/lib/paperless.ts` with `fetchPaperlessDocuments` and `fetchPaperlessThumbnail` — same shape as the Immich helpers.

## Per-theme treatment

- **Quartz** — count in tabular mono eyebrow, thumbnails framed with a hairline, titles in mono with truncation.
- **Atrium** — count in light italic Fraunces, thumbnails soft-shadow elevated, titles lowercase italic.
- **Marginalia** — count as small-caps Source Serif under a hairline, thumbnails in the book-plate frame.

## Open questions

- "Inbox" detection: Paperless has no built-in flag for inbox documents; it's done by filtering on a configured inbox tag. Two options:
  1. Make the user pass `inboxTagId` in config.
  2. Use `GET /api/tags/?is_inbox_tag=true` to discover it automatically at request time, cache the lookup.
  Option 2 is friendlier — go with that, fall back to a `inboxTagId` override.
- Document title fallback: if `title` is empty, fall back to `original_file_name`.
- Pagination: not needed in v1 — `limit` is small.
