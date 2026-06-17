---
status: open
---

# UI overhaul: typography-heavy, clean, minimalistic

Research a handful of nice, typography-driven minimalist sites and emulate their colors + fonts in nook.

## Sites to study (starter list — expand as you find more)

- **Vercel / Linear / Stripe** — restrained palettes, generous whitespace, system-feel sans-serifs
- **Are.na, Read.cv, Cosmos** — editorial vibe, more serif/transitional accents, muted neutrals
- **Tailwind UI marketing pages, Catalyst** — disciplined type scale
- **Personal "stoic homepage" inspirations** — Jeremy Singer-Vine, Robin Rendle, Maggie Appleton, Frank Chimero
- **Newspaper-of-the-web style** — NYT Magazine longform, The Markup, Inverse longform
- **Type foundries themselves** — Klim, Pangram Pangram, Grilli Type (they design their own marketing very well)

For each site captured, note: primary font(s), heading/body pairing, base size, leading, max line length, background/foreground/accent hex.

## Deliverable

- Pick 2–3 directions and mock them in `src/app/page.tsx` behind a quick switch (or branch each).
- Update `globals.css` Tailwind tokens (`--background`, `--foreground`, `--muted`, `--accent`, `--border`, `--ring`) and the font setup in `layout.tsx`.
- Candidates to try in place of Geist:
  - Inter Tight / Inter Display
  - IBM Plex Sans + IBM Plex Serif
  - Fraunces (serif display) + Inter (body)
  - JetBrains Mono only for the clock — keep it as a hero element
  - A neutral system stack (`ui-sans-serif`) for max performance + native feel
- Re-test in light + dark.

## Scope notes

- Keep the widget-card pattern; the overhaul is mostly type, color, spacing, density.
- Don't introduce a UI framework beyond shadcn/Tailwind.
- Don't ship until at least one direction has been eyeballed in-browser with the real config (clock, search, links, RSS, Readwise).
