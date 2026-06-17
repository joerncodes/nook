---
status: open
---

# Unsplash photo widget

A widget that pulls a single nice photo from Unsplash, themed by the active dashboard direction. Picture-of-the-day energy — a moment of visual pause among the typography.

## Why

The dashboard is all type right now. A single high-quality image, refreshed daily (or per session), gives the page a different temperature and breaks the monotony without adding chrome.

## Sketch

- New widget type: `unsplash`. Schema in `src/lib/config.ts`.
- Config:
  - `accessKey` (required, Unsplash API access key — get one at https://unsplash.com/developers)
  - `query` (optional, e.g. `architecture`, `mountain`, `interior`) — defaults to nothing (Unsplash returns from the editorial feed)
  - `collectionId` (optional, alternative to `query` — pull from a specific Unsplash collection)
  - `orientation` (optional: `landscape | portrait | squarish`) — default `landscape`
  - `refresh` (optional: `daily | session | request`) — default `daily`. Drives the `next.revalidate` window.
  - `title` (optional, like other widgets)
- Server component fetch via `https://api.unsplash.com/photos/random` with the access key in `Authorization: Client-ID <key>`.
- Render: the photo, scaled to fit the widget card, with a small attribution line below — name + Unsplash link (required by their TOS).
- Use a plain `<img>` (project convention; avoids next.config remotePatterns plumbing).

## Per-theme treatment

- **Quartz** — square crop, slight desaturation, photographer credit in tracked uppercase mono with a leading `▍` signal mark.
- **Atrium** — natural ratio, soft shadow elevation, photographer credit lowercase italic with leading em-dash.
- **Marginalia** — book-plate framing (gold-thread border + light shadow, same as Readwise cover), credit in small-caps Source Serif under a hairline.

## Open questions

- Caching: respect Unsplash rate limits (50 req/hr on the demo tier). With `refresh: daily`, `revalidate: 86400` is safe. With `session`, we'd need a per-load fetch — set a higher cache to be polite.
- Should the widget be a center hero, or sidebar? Probably configurable just by where you place it in `dashboard.yaml`.
- Attribution placement: under the image or floating over it? Under is safer for legibility.
- Click behaviour: open the source `links.html` URL on Unsplash so the photographer gets the referral credit they're owed.
