# CaseLearn

Commit to an answer before you see any feedback, then check your reasoning by
running code. See [ROADMAP.md](ROADMAP.md) for the learning plan and the
platform phases.

## Setup

Requires **Node 22.18+** (`nvm use` reads `.nvmrc`), plus `python3` and `g++` for
building predict-output items.

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

### Item types

| `type` | What you do | Key fields |
|---|---|---|
| `case-mcq` | Read a scenario, pick 1 of 4 options | `scenario`, `question`, `options`, `correct_option_id`, optional Python `experimentation` |
| `predict-output` | Predict what a Python or C++ snippet prints | `language`, `code`, `explanation`, optional `distractors` (multiple-choice mode), `try_this` |
| `concept` | Write an explanation, then grade it against key points | `prompt`, `key_points` (2–6), `model_answer`, `follow_ups` |

Text fields support `` `code` ``, `**bold**`, `*italic*` and ```` ``` ```` code blocks.

### predict-output: never write the answer

**Don't put `expected_output` in the file.** The build runs every snippet and
fills it in, so the answer can't be wrong:

- Python runs with the local `python3`, twice with different hash seeds; output
  that depends on set/dict ordering of strings fails the build.
- C++ is compiled with `g++ -std=c++20 -O0` plus AddressSanitizer and UBSan;
  undefined behaviour, leaks or crashes fail the build. A snippet must exit 0.
  To show an exception, catch it and print `type(e).__name__`.
- A distractor equal to the real output fails the build.
- Avoid output that differs between Python versions (exception messages,
  `repr` details): the in-browser sandbox runs Pyodide's Python 3.12.

Results are cached in `node_modules/.cache/caselearn/`, so only new or edited
snippets are re-run.

### Building

`npm run content` validates everything and writes the bundled
`public/content/` (generated, not committed). Any invalid item fails the
build with the file name and the problem. Within a track, items are ordered
beginner → advanced, then by id.

## Progress

Progress is stored in the browser's `localStorage` (`caselearn_progress_v2`):
one record per attempt, with whether it was correct. Old v1 progress is
migrated automatically. Use **Export / Import** at the bottom of the home page
to back it up or move it to another browser.
