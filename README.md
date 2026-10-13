# CaseLearn

Commit to an answer before you see any feedback, then check your reasoning by
running code. See [ROADMAP.md](ROADMAP.md) for the learning plan and the
platform phases.

## Setup

Requires **Node 22.18+** (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run dev      # builds content, then starts Vite
npm test         # Vitest
npm run lint     # oxlint
npm run build    # builds content, type-checks, bundles to dist/
```

## Adding content

Every item is one JSON file at `content/<track>/<topic>/<id>.json`; the
schema is in [src/content/schema.ts](src/content/schema.ts).

- `id` is kebab-case, globally unique, and matches the file name. **Never
  renumber an id**, because saved progress is keyed by it. New items use
  `<track-abbr>-<topic-abbr>-NNN`, e.g. `os-sched-001`. The original 40 keep
  their `cs-NN` ids.
- `track` must match the top-level folder.
- Set `verified: true` only after you have checked the answer key yourself.

`npm run content` validates everything and writes the bundled
`public/content/` (generated, not committed). Any invalid item fails the
build with the file name and the problem.

## Progress

Progress is stored in the browser's `localStorage` (`caselearn_progress_v2`):
one record per attempt, with whether it was correct. Old v1 progress is
migrated automatically. Use **Export / Import** at the bottom of the home page
to back it up or move it to another browser.
