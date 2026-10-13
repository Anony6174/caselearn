# CaseLearn

Commit to an answer before you see any feedback, then check your reasoning by
running code. See [ROADMAP.md](ROADMAP.md) for the learning plan and the
platform phases.

## Setup

Requires **Node 22.18+** (`nvm use` reads `.nvmrc`), plus `python3`, `g++` (13+)
and `bash` (4+) for building content and running C++/Bash challenges.

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
| `code-challenge` | Write Python, C++ or Bash that passes a test harness | `language`, `statement`, `starter_code`, `harness`, `reference_solution`, `hints`, `discussion` |

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

### code-challenge: tests are proven against a reference

The harness is ordinary code using small helpers (see
[src/runners/preludes/](src/runners/preludes/)):

- **Python:** `@test("name")` on a function that uses `assert`; `raises(Exc, fn, *args)`.
- **C++:** `TEST("name") { CHECK(...); CHECK_EQ(actual, expected); CHECK_THROWS(expr, Exc); }`.
  The user's code must not define `main()`.
- **Bash:** the user's script is `$SOLUTION`. Run it with `run_solution ARGS`
  (sets `$out`, `$err`, `$status`), or `source "$SOLUTION"` to test functions.
  Report with `pass NAME`, `fail NAME DETAIL` or `expect_eq NAME EXPECTED ACTUAL`.
  Put each test in `( cd "$(fresh_dir)"; ... )` so tests can't affect each other.

The build runs the harness against `reference_solution`, where every test
(at least 3) must pass with a clean exit, and against `starter_code`, which must
run (C++: compile) and fail at least one test. It records the test names; don't
write `test_names` yourself. C++ is compiled with `-std=c++20 -Wall -Wextra`
plus AddressSanitizer/UBSan, so leaks and undefined behaviour fail. Runs use
`LC_ALL=C.UTF-8` so `sort` is deterministic.

### Running challenges: the local runner

Python challenges run in the browser (Pyodide). C++ and Bash run with your
local `g++` and `bash` through a small endpoint that `npm run dev` and
`npm run preview` add ([scripts/local-runner.ts](scripts/local-runner.ts)).
It only accepts requests from the app's own page on localhost (Host, Origin
and a custom header are checked), runs each program in a fresh temp directory
with a time limit, and doesn't exist on a static deploy, where the app says
"start it with npm run dev" instead. It runs your code with your user's
permissions, exactly like running it in a terminal.

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
