---
status: done
---

# Visual QA the layout in a browser

Build compiles, but no one has eyeballed it. Run `pnpm dev` and check:

- Center column proportions feel right with 0, 1, 2, and 3+ side columns
- Side columns split evenly around center (odd counts put the extra on the right)
- Search input autofocuses and submits to DDG
- Clock ticks and respects `format24h` / timezone
- Links favicons load (DDG icons service)
- RSS widget renders Hacker News front page
- Greeting shows a random language on each load; tooltip says "This is X"; clicking the word re-rolls
- Readwise widget loads today's review, Next/Back navigation works, progress survives a reload, "Finish" on the last highlight flips to the Done state, Restart resets

If anything looks off, adjust spacing/typography in `src/app/page.tsx` and widget components.
