---
status: open
---

# Light/dark theme switcher

A user-facing toggle to switch the dashboard between a light and dark presentation of the active theme.

## Why

Right now each theme bakes in one palette. Time of day, ambient light, and personal preference all argue for a flip — and a switcher costs little once the theme tokens are factored cleanly.

## Sketch

- Each theme exposes a `light` and `dark` token set (background, foreground, muted, accent, rule, etc.) instead of one flat palette.
- Preference resolution order: explicit user choice (persisted) → `prefers-color-scheme` → theme default.
- Persist the choice in `localStorage`; hydrate on the client without a flash (inline script in the root layout that sets a `data-theme-mode` attribute before paint).
- Toggle UI: a small control in a corner — either a sun/moon glyph or a typographic `light · dark` pair that fits the active theme's voice.
- Per-theme treatment of the toggle itself (Quartz: tracked mono label; Atrium: lowercase italic; Marginalia: small-caps under a hairline).

## Open questions

- Should `system` be a third explicit option, or just the default when no choice is stored?
- Do widget-specific assets (Unsplash photo, Immich image) need dark-mode variants, or is a CSS filter acceptable?
- Per-theme override — should a theme be allowed to opt out of dark mode entirely (e.g. Marginalia as a "daylight only" book-plate)?
