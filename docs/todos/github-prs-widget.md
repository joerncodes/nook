---
status: open
---

# GitHub PRs widget

Your open pull requests + the ones waiting on your review, across all repos a token can see.

## Why

PRs are where the day actually happens. A single list of "mine + waiting on me" with status dots beats N tab-bookmarks and is faster than opening GitHub. Pairs well with the todoist widget — that's *what to do*, this is *what's blocked on me*.

## v1 scope

- New widget type: `github-prs`. Schema in `src/lib/config.ts`.
- Config:
  - `token` (required — fine-grained PAT with `Pull requests: read` and `Contents: read` on the orgs/repos that matter; or a classic PAT with `repo` scope)
  - `username` (required — used for the search queries; we don't infer it to avoid an extra `GET /user` round-trip)
  - `mode` (optional: `mine | review | both`) — default `both`
  - `limit` (optional 1–20) — default `10`
  - `org` (optional string) — scope to one org (`org:foo` filter)
  - `title` (optional)
- Server component, single fetch per render, `revalidate: 300`.

## Endpoints

- Auth: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`.
- Use the search API (covers cross-repo in one call):
  - Mine: `GET /search/issues?q=is:pr+is:open+author:{username}{+org:x}&sort=updated&per_page={limit}`
  - Review: `GET /search/issues?q=is:pr+is:open+review-requested:{username}{+org:x}&sort=updated&per_page={limit}`
- For each PR's check status, the search response doesn't include it. Two options:
  1. **v1**: skip status dots, just show title + repo + age. One API call total per mode.
  2. **v1.1**: per-PR `GET /repos/{owner}/{repo}/commits/{sha}/check-runs` — N extra calls. Gate behind a `showStatus: true` flag.
- Rate limit: authenticated search is 30 req/min. With `revalidate: 300` and 2 calls per render we're nowhere near the cap.

## Render

- Two sections (when `mode: both`): `Mine` and `Review`. Headings only render when both have items.
- Each row: repo (`org/name`) in muted small, PR title bold-ish, age (`2h`, `3d`) right-aligned.
- Optional leading dot when `showStatus: true`: green (success) / red (failure) / yellow (pending) / gray (no checks).
- Click → opens the PR on github.com in a new tab.

## Per-theme treatment

- **Quartz** — repo in tracked uppercase mono, title in regular mono, age in tabular mono right-aligned. Status dot as a leading `▍` colored to state.
- **Atrium** — repo in muted lowercase, title in light Fraunces, age in italic. Status as a soft filled circle in the gutter.
- **Marginalia** — repo as small-caps Source Serif, title in regular serif, age in italic. Hairline between sections.

## Open questions

- Draft PRs: include or exclude? The search query includes them by default; add `+draft:false` if we want to hide. Probably show them but with a `[draft]` prefix or dimmed.
- Multi-org users: the `org` filter is single-value. If someone needs multi-org, they can place multiple widgets, one per org.
- Token storage: same gitignore caveat as the rest — `dashboard.yaml` holds it, never leaks to the client (server component only, no proxy route needed since the widget renders text, not binary assets).
- Failure modes: when GitHub is down or the token is bad, render a small "couldn't load PRs" line — don't crash the whole page.
