---
status: done
---

# Weather widget

Current conditions + a short forecast strip for one location. Open-Meteo, no API key.

## Why

The dashboard has a clock and (in atrium) a day-bar — temperature and "will I need a jacket" is the obvious next ambient signal. Open-Meteo is free, no key, generous rate limits, and returns everything needed in a single call.

## v1 scope

- New widget type: `weather`. Schema in `src/lib/config.ts`.
- Config:
  - `lat`, `lon` (required, numbers)
  - `label` (optional, e.g. `Köln`) — shown above/next to the temp; defaults to nothing
  - `units` (optional: `metric | imperial`) — default `metric`
  - `days` (optional 0–7) — forecast strip length, default `3`. `0` hides the strip.
  - `title` (optional)
- Server component, single fetch per render, `revalidate: 600` (10 min).

## Endpoint

- `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days={days+1}&timezone=auto&temperature_unit={c|f}&wind_speed_unit={kmh|mph}`
- Map `weather_code` (WMO) → icon + label via a small lookup table in `src/lib/weather.ts`. Lucide has most of what we need (`Sun`, `CloudRain`, `CloudSnow`, `CloudLightning`, `Cloud`, `CloudFog`).

## Render

- Big current temp, weather icon, location label.
- Forecast strip: N tiles, each `Day · icon · max°/min°`.
- No background fetches on the client — fully server-rendered, refreshes when the page does.

## Per-theme treatment

- **Quartz** — tabular mono temps, eyebrow label (`KÖLN`), hairline rule between current and forecast strip.
- **Atrium** — large light Fraunces temp, icon in muted accent; forecast tiles set in lowercase italic with soft separators.
- **Marginalia** — temp set as small-caps Source Serif with a leading degree glyph; forecast tiles in a single-rule table-of-contents row.

## Open questions

- Geocoding: skip for v1, user supplies lat/lon. If we add a `place` string later, use Open-Meteo's free geocoding API and resolve at config-load.
- Multi-location: just place multiple `weather` widgets. No multi-city tile in v1.
- Unit display: `°C` / `°F` glyphs vs. bare numbers — bare numbers in Quartz, with-glyph in Atrium/Marginalia.
