@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — Next.js dev server (Turbopack).
- `pnpm build` — production build. `next.config.ts` sets `output: "standalone"` for the Docker runtime.
- `pnpm start` — run the built standalone server.
- `pnpm lint` — ESLint (flat config via `eslint.config.mjs`, extends `next/core-web-vitals` + `next/typescript`).
- No test runner is configured.
- Docker: `docker build -t nook .` then `docker run --rm -p 3000:3000 -v "$PWD/config:/config:ro" nook`. The image expects the config at `/config/dashboard.yaml` (set via `CONFIG_PATH` env var).

## Architecture

Single-page personal-homepage app. The page is fully server-rendered (`force-dynamic`) from a YAML config; widgets are added/removed by editing YAML, never by changing routes.

**Config-driven rendering pipeline.** `src/lib/config.ts` defines a Zod `discriminatedUnion("type", …)` of widget schemas plus a `DashboardConfig` of `{ title, theme, center[], columns[] }`. `loadConfig()` reads `CONFIG_PATH` (default `./config/dashboard.yaml`), falls back to a hardcoded `DEFAULT_CONFIG` when the file is missing (ENOENT), and otherwise throws. `src/app/page.tsx` calls `loadConfig()` on every request, splits `columns` into left/right side groups around the center column, and delegates each widget to `WidgetRenderer` in `src/components/widgets/widget.tsx`. That renderer is a `switch` on `widget.type`; adding a widget means: new Zod schema → add to the discriminated union → new component → new `case` in the switch.

**Card vs. naked widgets.** `WidgetRenderer` keeps `NAKED = {clock, search, greeting}` (rendered bare unless they have a title) and `SELF_TITLED = {jellyfin}` (renders its own header). Everything else gets a shadcn `Card` with a `CardHeader`/`CardTitle` when `title` is set. Don't add chrome inside a widget that's also wrapped by the renderer.

**Secrets & proxy routes.** Widget configs carry credentials (Readwise/Todoist/Immich/Jellyfin/Edgewise tokens). Server components fetch upstream APIs directly; binary assets (images, posters) go through `src/app/api/{immich,jellyfin,edgewise}/…/route.ts` proxies so tokens never leave the server. Those routes locate credentials by scanning `cfg.center` + `cfg.columns.flatMap(c => c.widgets)` for a matching widget — a single widget instance per provider is assumed.

**Themes.** `themeSchema` enum (`quartz | atrium | marginalia`, default `atrium`) is applied as `data-theme` on the root `<div>`; CSS in `src/app/globals.css` keys off that attribute. The `atrium` theme additionally renders the client `<AtriumDayBar/>` and sets a `data-phase` (`morning|midday|dusk|night`) derived from the server's wall-clock hour — keep server/client clock-derived state inside `useEffect` to avoid hydration mismatches.

## Conventions

- Path alias: `@/*` → `src/*` (see `tsconfig.json`).
- shadcn components live in `src/components/ui/` (config in `components.json`, "new-york" style, `lucide` icons). Use the CLI rather than hand-writing wrappers.
- `dashboard.yaml` is gitignored (holds tokens); `config/dashboard.example.yaml` is the template.
- Changes to `dashboard.yaml` take effect on the next request — no rebuild needed because the page is `force-dynamic`.

## Todos

Open work items live as individual files under `docs/todos/`, with `status: open|in-progress|done` frontmatter. Closing a todo means flipping the status to `done` **and** renaming to `DONE-<slug>.md` (see `docs/todos/README.md`).
