# Widgets

Every widget in `dashboard.yaml` is an entry under `center:` or under one of the `columns[].widgets:` arrays. Each widget is keyed by `type:` and accepts an optional `title:` (rendered as the card header). The tables below list each widget's specific options.

| Widget                      | Purpose                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| [`greeting`](#greeting)     | Time-of-day greeting line.                                             |
| [`clock`](#clock)           | Big clock with optional date, ISO week, and spelled-out time.          |
| [`search`](#search)         | Search input pointed at an engine of your choice.                      |
| [`links`](#links)           | Static link list.                                                      |
| [`note`](#note)             | Free-text block.                                                       |
| [`rss`](#rss)               | Latest items from an RSS/Atom feed.                                    |
| [`weather`](#weather)       | Current weather + N-day forecast (Open-Meteo).                         |
| [`calendar`](#calendar)     | Upcoming events from one or more ICS sources + mini month grid.        |
| [`todoist`](#todoist)       | Tasks matching a Todoist filter.                                       |
| [`readwise`](#readwise)     | Today's Readwise daily review with next/prev navigation.               |
| [`linkwarden`](#linkwarden) | Recent saves from a Linkwarden instance, with full-library search.     |
| [`immich`](#immich)         | Photo of the day (or carousel) from an Immich library.                 |
| [`jellyfin`](#jellyfin)     | Latest-added pick from a Jellyfin server + library counts.             |
| [`edgewise`](#edgewise)     | Knife backlog queue from an Edgewise instance.                         |

A few conventions used in the tables:

- **Type** uses TypeScript-ish shorthand (`string`, `number`, `boolean`, `string[]`, `"a" \| "b"`).
- **Required** = no default; the widget will fail to load without it.
- All widgets accept an optional `title` (string). When set, the widget is wrapped in a card with that title as a header.

---

## greeting

Renders a time-of-day greeting ("Good morning, Jörn"). Rendered without card chrome unless `title` is set.

| Option | Type   | Default | Description                                  |
| ------ | ------ | ------- | -------------------------------------------- |
| `name` | string | —       | The name to greet. Omit for a generic line.  |

```yaml
- type: greeting
  name: Jörn
```

---

## clock

| Option      | Type    | Default | Description                                                                                 |
| ----------- | ------- | ------- | ------------------------------------------------------------------------------------------- |
| `timezone`  | string  | system  | IANA tz string (e.g. `Europe/Berlin`). Defaults to the server's timezone.                   |
| `format24h` | boolean | `true`  | 24-hour clock. Set `false` for 12-hour with AM/PM.                                          |
| `showDate`  | boolean | `true`  | Show the date line below the time.                                                          |
| `showWeek`  | boolean | `false` | Show the ISO calendar-week number.                                                          |
| `words`     | boolean | `false` | Spell out the current time in English ("ten past seven."). Replaces the digit display.      |

Rendered without card chrome unless `title` is set.

```yaml
- type: clock
  format24h: true
  showDate: true
  showWeek: true
  words: true
```

---

## search

A single input that submits to a web search engine. Press the input to focus; press Enter to navigate.

| Option        | Type                                                       | Default       | Description                       |
| ------------- | ---------------------------------------------------------- | ------------- | --------------------------------- |
| `engine`      | `"duckduckgo" \| "google" \| "kagi" \| "brave" \| "startpage"` | `duckduckgo` | Which engine to submit to.        |
| `placeholder` | string                                                     | `Search…`     | Placeholder text inside the input. |

Rendered without card chrome unless `title` is set.

```yaml
- type: search
  engine: duckduckgo
  placeholder: Search the web…
```

---

## links

| Option    | Type                                | Default    | Description                                           |
| --------- | ----------------------------------- | ---------- | ----------------------------------------------------- |
| `items`   | `{ title: string, url: string, icon?: string }[]` | **required** | Link list. `icon` is optional and reserved.       |
| `columns` | integer 1–4                         | `1`        | Layout columns. Use `2`/`3`/`4` for grid-style lists. |

```yaml
- type: links
  title: Dev
  columns: 1
  items:
    - title: GitHub
      url: https://github.com
    - title: Vercel
      url: https://vercel.com
```

---

## note

| Option | Type   | Default       | Description                                                  |
| ------ | ------ | ------------- | ------------------------------------------------------------ |
| `body` | string | **required**  | Free-text body. Use YAML's `\|` block scalar for multi-line. |

```yaml
- type: note
  title: Today
  body: |
    - Standup 10:00
    - Review PRs
```

---

## rss

| Option  | Type        | Default | Description                              |
| ------- | ----------- | ------- | ---------------------------------------- |
| `url`   | string      | **required** | RSS or Atom feed URL.                |
| `limit` | integer 1–50 | `10`   | Maximum items to display.                |

```yaml
- type: rss
  title: HN Front Page
  url: https://hnrss.org/frontpage
  limit: 8
```

---

## weather

Powered by Open-Meteo (no API key required).

| Option  | Type                       | Default  | Description                                                       |
| ------- | -------------------------- | -------- | ----------------------------------------------------------------- |
| `lat`   | number, –90 to 90          | **required** | Latitude. Look up at https://www.latlong.net/ or any map.    |
| `lon`   | number, –180 to 180        | **required** | Longitude.                                                    |
| `label` | string                     | —        | Location label rendered next to the current temperature.          |
| `units` | `"metric" \| "imperial"` | `metric` | °C/km/h vs °F/mph.                                                 |
| `days`  | integer 0–7                | `3`      | Days in the forecast strip (`0` hides the forecast).              |

```yaml
- type: weather
  title: Köln
  lat: 50.9375
  lon: 6.9603
  label: Köln
  units: metric
  days: 3
```

---

## calendar

Upcoming events from one or more ICS URLs (Google Calendar, iCloud, Nextcloud, Radicale, Fastmail — anything that exposes a `text/calendar` subscription URL). Renders an optional mini month grid above a day-grouped event list. ICS URLs are credentials in disguise; keep them out of public repos.

For Google Calendar, the URL must be the **iCal export** (path contains `/calendar/ical/.../basic.ics`), not the UI link (`/calendar/u/0?cid=…`). Grab the URL from Calendar settings → Integrate calendar → "Secret address in iCal format".

| Option         | Type                  | Default   | Description                                                                                 |
| -------------- | --------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `sources`      | `CalendarSource[]`   | **required** (≥1) | One entry per feed. See shape below.                                                |
| `limit`        | integer 1–20          | `5`       | Maximum events listed.                                                                       |
| `days`         | integer 1–60          | `14`      | Look-ahead window in days. Set to `31` for full-month dot coverage in the grid.              |
| `showAllDay`   | boolean               | `true`    | Include all-day events.                                                                      |
| `relativeDays` | boolean               | `true`    | Use `Today` / `Tomorrow` headings. `false` always shows absolute dates (`Wed 18 Jun`).        |
| `showMonth`    | boolean               | `true`    | Render the mini month grid above the events list.                                            |
| `weekStart`    | `"mon" \| "sun"`     | `mon`     | Which weekday starts each row in the month grid.                                             |

`CalendarSource` shape:

| Field   | Type   | Default | Description                                                |
| ------- | ------ | ------- | ---------------------------------------------------------- |
| `url`   | string | **required** | ICS URL. `webcal://` is rewritten to `https://`.        |
| `label` | string | —       | Label shown in error messages and (future) source filters. |
| `color` | string | —       | CSS color string. Used for the event's gutter dot.         |

```yaml
- type: calendar
  title: Upcoming
  sources:
    - label: Personal
      color: "#7c9885"
      url: https://calendar.google.com/calendar/ical/.../basic.ics
  limit: 5
  days: 14
  showAllDay: true
  relativeDays: true
  showMonth: true
  weekStart: mon
```

---

## todoist

| Option         | Type        | Default     | Description                                                                              |
| -------------- | ----------- | ----------- | ---------------------------------------------------------------------------------------- |
| `token`        | string      | **required** | Personal API token — https://app.todoist.com/app/settings/integrations/developer.    |
| `filter`       | string      | **required** | Todoist filter syntax — https://todoist.com/help/articles/206137851.                 |
| `limit`        | integer 1–50 | `10`        | Maximum tasks shown.                                                                     |
| `hideSubtasks` | boolean      | `false`     | When `true`, only top-level tasks are shown.                                             |

```yaml
- type: todoist
  title: Today
  filter: today | overdue
  limit: 12
  hideSubtasks: true
  token: REPLACE_WITH_YOUR_TODOIST_TOKEN
```

---

## readwise

Renders today's Readwise Daily Review. Progress is tracked in browser localStorage, keyed by local date (`YYYY-MM-DD`) so the "done" state resets at local midnight regardless of when Readwise rolls the new review.

The upstream API is cached for ~5 minutes via Next's data cache; expect up to that much lag after Readwise issues today's review.

| Option         | Type    | Default | Description                                                                                     |
| -------------- | ------- | ------- | ----------------------------------------------------------------------------------------------- |
| `token`        | string  | **required** | Access token — https://readwise.io/access_token.                                            |
| `showImage`    | boolean | `false` | Show the book/article cover image to the left of the highlight.                                 |
| `hideWhenDone` | boolean | `false` | Collapse the whole widget after you finish the review. `false` keeps a "Done" line + Restart.   |

```yaml
- type: readwise
  title: Readwise daily review
  showImage: true
  hideWhenDone: true
  token: REPLACE_WITH_YOUR_READWISE_TOKEN
```

---

## linkwarden

Recent saves plus a search field with autocomplete over the full library. Search results replace the recent list inline (no overlay). Press `/` to focus the input.

| Option              | Type    | Default               | Description                                                                |
| ------------------- | ------- | --------------------- | -------------------------------------------------------------------------- |
| `baseUrl`           | string  | **required**          | Linkwarden base URL (e.g. `https://linkwarden.my.domain`).                 |
| `token`             | string  | **required**          | Access token — Linkwarden Settings → Access Tokens.                        |
| `collectionId`      | integer | —                     | Scope recent + search to one collection.                                   |
| `tagId`             | integer | —                     | Scope recent + search to one tag. Combinable with `collectionId`.          |
| `limit`             | integer 1–20 | `8`              | Number of recent saves shown.                                              |
| `search`            | boolean | `true`                | Show the search field. `false` renders only the recent list.               |
| `searchPlaceholder` | string  | `Search bookmarks…`   | Placeholder text inside the search input.                                  |

```yaml
- type: linkwarden
  title: Bookmarks
  baseUrl: https://linkwarden.your.domain
  token: REPLACE_WITH_YOUR_LINKWARDEN_TOKEN
  limit: 8
  search: true
  searchPlaceholder: Search bookmarks…
```

---

## immich

Photo of the day from an Immich library, with optional auto-rotating crossfade carousel.

| Option        | Type                       | Default      | Description                                                                          |
| ------------- | -------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `baseUrl`     | string                     | **required** | Immich base URL.                                                                     |
| `apiKey`      | string                     | **required** | API key — Immich User Settings → API Keys.                                           |
| `favorites`   | boolean                    | `false`      | Pull from your favorites. Either this OR `albumId`.                                  |
| `albumId`     | string                     | —            | Pull from a specific album. Either this OR `favorites`.                              |
| `limit`       | integer 1–20               | `6`          | Pool size to sample from / rotate through.                                           |
| `autoRotate`  | boolean                    | `true`       | Auto-advance the carousel. `false` requires manual → click to advance.               |
| `orientation` | `"landscape" \| "portrait"` | —            | Filter the candidate pool to one orientation. Omit to allow both.                    |
| `stats`       | boolean                    | `true`       | Show the photos/videos/storage stats row below the image.                            |

```yaml
- type: immich
  title: Photos
  baseUrl: https://immich.your.domain
  apiKey: REPLACE_WITH_YOUR_IMMICH_API_KEY
  favorites: true
  limit: 6
  autoRotate: true
  stats: true
```

---

## jellyfin

Picks a random title from the latest-added items in your Jellyfin library and shows movie/episode counts.

| Option      | Type                                       | Default      | Description                                                            |
| ----------- | ------------------------------------------ | ------------ | ---------------------------------------------------------------------- |
| `baseUrl`   | string                                     | **required** | Jellyfin base URL.                                                     |
| `apiKey`    | string                                     | **required** | API key — Jellyfin Dashboard → API Keys.                               |
| `userId`    | string                                     | **required** | User ID — Dashboard → Users → pick a user (`userId` in URL).           |
| `showLatestMovie` | boolean                              | `true`       | `false` hides the entire "latest added" pick row, leaving only the library counts. |
| `coverSize`       | `"small" \| "medium" \| "large"`   | `medium`     | Poster width when shown: `small` 48px, `medium` 96px, `large` 160px.   |

This widget renders its own title via the card header (it's in the `SELF_TITLED` set), so the `title` becomes a link to the Jellyfin web UI.

```yaml
- type: jellyfin
  title: Library
  baseUrl: https://jellyfin.your.domain
  apiKey: REPLACE_WITH_YOUR_JELLYFIN_API_KEY
  userId: REPLACE_WITH_YOUR_JELLYFIN_USER_ID
  showLatestMovie: true
  coverSize: medium
```

---

## edgewise

Shows the top of the knife backlog from an Edgewise instance plus library counts.

| Option    | Type        | Default      | Description                                                       |
| --------- | ----------- | ------------ | ----------------------------------------------------------------- |
| `baseUrl` | string      | **required** | Edgewise base URL.                                                |
| `token`   | string      | **required** | Bearer token issued by the Edgewise instance.                     |
| `limit`   | integer 1–20 | `5`         | Maximum backlog entries shown (the hero card plus the tail list). |

```yaml
- type: edgewise
  title: Edgewise
  baseUrl: https://edgewise.your.domain
  token: REPLACE_WITH_YOUR_EDGEWISE_TOKEN
  limit: 5
```

---

## Themes

The top-level `theme:` key selects the visual treatment for the whole dashboard. Each widget above has theme-specific styling.

| Theme        | Feel                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `quartz`     | Spreadsheet / blueprint — mono, tracked uppercase, hairline rows.     |
| `atrium`     | Daylight-driven warm palette, italic Fraunces, soft hover.            |
| `marginalia` | Source Serif, small-caps headers, hairline rules.                     |

`atrium` is the default. The clock-derived `data-phase` (`morning|midday|dusk|night`) only applies under `atrium`.
