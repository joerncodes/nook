# Open todos

Each `.md` file in this folder is one todo. Frontmatter:

```yaml
---
status: open | in-progress | done
---
```

Keep titles short, body explains the why and a sketch of the work.

## Lifecycle

- New work → create `<slug>.md` with `status: open`.
- Start work → flip frontmatter to `status: in-progress`.
- Close work → flip frontmatter to `status: done` **and rename to `DONE-<slug>.md`**. The `DONE-` prefix sorts closed work to the bottom and makes the status obvious at a glance.
