---
status: done
---

# Todoist reading widget

A read-only widget that shows my current Todoist tasks — today + overdue, capped at a reasonable count. Similar shape to the RSS widget: server-fetched on render, no client-side polling.

## Why

The dashboard is the first surface I look at; my open tasks should be there. Read-only is enough — I don't need to check tasks off from here (Todoist's own apps are fine for that).

## Sketch

- Widget type: `todoist`. New entry in the discriminated union in `src/lib/config.ts`.
- Config: `token` (Todoist API token), `filter` (required, Todoist filter syntax — e.g. `today | overdue`, `#Work & p1`, `(no date | overdue) & p1`), optional `limit` (default 10), optional `title`.
- Server component (like `RssWidget`), `fetch` with `next: { revalidate: 300 }`.
- Endpoint: `https://api.todoist.com/rest/v2/tasks?filter=<filter>` with `Authorization: Bearer <token>`.
- Render: list of tasks. For each, show content (markdown-ish — strip or render basic), due date if present, and project (small + muted). Overdue rows get the theme's signal color.
- Theme-aware via the existing per-theme CSS rules in `globals.css` (mono for quartz, lowercase serif italic for marginalia, etc.) — no per-theme tweaks should be needed beyond the existing `[data-slot="card-content"] ul li a` selectors.

## Open questions

- Token storage: same yaml-inline approach as Readwise is fine for a personal dashboard, but it's a token in plaintext in the repo. Consider `${env:TODOIST_TOKEN}` interpolation in the config loader as a follow-up.
- Click behaviour: open the task in Todoist web (`https://todoist.com/showTask?id=<id>`)? Open in the Todoist desktop app via custom-scheme URL? Web link is the safe default.
- Empty state: "Inbox zero" type message, themed (e.g. quartz: `— END OF QUEUE —`; marginalia: italic "nothing pending.").
