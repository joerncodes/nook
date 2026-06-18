---
status: done
---

# In-app modal for editing `config/dashboard.yaml`

A button somewhere unobtrusive (top-right corner?) opens a modal that lets me edit `dashboard.yaml` from the dashboard itself. Save writes back to disk; the page reloads with the new config.

## Why

Editing widgets currently requires opening the repo, finding the yaml, editing it, restarting the dev server (or rebuilding the container). For a personal dashboard, the round-trip should be one button.

## Sketch

- A small icon button (gear / pencil) in a corner — should respect the active theme (subtle, not chrome-heavy).
- Click → modal with a textarea (or a tiny code editor — Monaco is overkill, plain `<textarea>` with a mono font is fine for v1).
- Pre-populated with current `dashboard.yaml` contents (read via a Server Action or a `/api/config` route).
- Save button writes the body back to `config/dashboard.yaml` and triggers a router refresh.
- Validate against `dashboardConfigSchema` (in `src/lib/config.ts`) before writing — on failure, show the Zod error inline and don't write.
- Cancel/Escape closes without saving.

## Open questions

- Auth? On localhost this is fine without; for the deployed container this needs *some* gate (env-var-set token in a header? basic auth on a middleware?).
- Backup before write? Writing a `.bak` next to the yaml on every save is cheap insurance.
- File-system write needs to work in both `next dev` (local repo path) and the container (volume-mounted `/config`). The `CONFIG_PATH` env already used by `loadConfig` is the source of truth — reuse it for the writer.
