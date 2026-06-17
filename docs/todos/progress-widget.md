---
status: open
---

# "Progress" time widget — month + year as dot rows

A small widget that visualises how far through the current month and year we are. Two rows of dots: one for the month (one dot per day), one for the year (one dot per week, or one per month — see open questions). Elapsed dots are colored with the theme's signal/accent; remaining dots are muted/outlined.

## Why

Calendars tell me *what date it is*. A progress bar tells me *how much of the unit is left*. Glanceable, no thinking required — surfaces the felt sense of "the month is nearly over" or "we're past midsummer."

## Sketch

- New widget type: `progress`. Schema in `src/lib/config.ts`.
- Config: optional `units` — defaults to `["month", "year"]`. Could include `week`, `day` (hours) later.
- Server component (or trivial client component — the unit boundaries change infrequently enough that SSR is fine and a single `useEffect` refresh per minute would be plenty).
- Render: per unit, a row of small dots. Elapsed = filled in `var(--signal)` (or `var(--foreground)` if signal feels too loud); remaining = `var(--border)` outlines or muted dots. A small text label to the right of (or above) each row: `JUN  17 / 30` or `2026  168 / 365`.

## Dot granularity — open question

- **month:** clearly one dot per day (28–31 dots).
- **year:** options to consider —
  - 52 dots (one per week) — cleanest row, fits comfortably.
  - 12 dots (one per month) — terse, but loses resolution. Could be 12 *big* dots with fractional fill on the current month.
  - 365 dots — accurate, but a ~365-dot row is busy unless it wraps into a grid.
- Lean towards **52 weeks** for the year.

## Theming

- Quartz: square dots, monospace label, signal color on elapsed.
- Atrium: round dots, lowercase label, soft muted vs accent split.
- Marginalia: round dots, small-caps label, iron-gall ink vs muted gold-thread.

## Stretch

- Pulse the *current* dot (today / this week) so the eye lands there.
- Optional `["day"]` unit = 24 dots, one per hour. Useful but probably redundant with the clock.
- Optional `["sprint"]` if I ever care about a custom 2-week cycle aligned to a start date.
