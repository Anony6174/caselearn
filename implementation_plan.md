# ML/Stats Case-Study Reasoning Platform — Implementation Plan

## 1. What this is

A website that tests *application reasoning* in ML/statistics, not recall. Each
unit is a case study: an ambiguous, realistic scenario, a multiple-choice
question about which method/metric fits it, and a live Python sandbox so the
user can verify their reasoning by actually running the numbers instead of
taking an explanation's word for it.

The `case_studies.json` file already produced is the content for the first
batch (10 cases) and defines the schema everything below is built around.

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS | Static build, no server needed, huge amount of training data/examples for a coding agent to draw on |
| Code editor | CodeMirror 6 (`@codemirror/lang-python`) | Lightweight, good mobile support, easy to theme |
| Python runtime | Pyodide, run inside a Web Worker | Executes real numpy/pandas/scipy/sklearn/matplotlib entirely in the visitor's browser — no server-side code execution to secure |
| Content | Static JSON (`case_studies.json`) served from `/public` | No database needed at this scale; adding a case study is a content-only change |
| Hosting | Vercel or Netlify (free tier, git-based deploy) | Static site, zero backend to provision |
| Backend | **None for MVP** | See Phase 6 for when this changes |

Deliberately no backend, no database, no auth for the MVP. The entire app is
static files plus client-side code. This keeps the surface area small enough
for a coding agent to build correctly in one pass per phase.

## 3. Repository structure

```
project-root/
  public/
    case-studies/
      case_studies.json          # the file already generated
  src/
    components/
      CaseList.tsx                # list/grid of case cards with filters
      CaseCard.tsx                 # single card: title, topic chips, difficulty badge
      FilterBar.tsx                # topic + difficulty filters
      QuestionPanel.tsx            # scenario + question + 4 options
      OptionChoice.tsx             # single selectable option
      ExplanationPanel.tsx         # post-submit: all 4 explanations, key_takeaway, common_misconception
      ProgressBadge.tsx            # "X / 10 completed" summary
      Sandbox/
        SandboxPanel.tsx           # container: objective + editor + output + controls
        CodeEditor.tsx             # CodeMirror wrapper
        OutputPanel.tsx            # stdout / errors / rendered matplotlib figures
        pyodide.worker.ts          # Web Worker: loads Pyodide, runs code, posts results back
    hooks/
      useCaseStudies.ts            # fetch + parse + validate case_studies.json
      usePyodideWorker.ts          # manages worker lifecycle, run/stop, message passing
      useProgress.ts               # localStorage-backed completion tracking
    types/
      caseStudy.ts                 # TypeScript types matching the JSON schema
    pages/
      HomePage.tsx                 # CaseList + FilterBar + ProgressBadge
      CaseStudyPage.tsx            # QuestionPanel -> ExplanationPanel -> SandboxPanel
    App.tsx                        # routing (react-router)
    main.tsx
  index.html
  package.json
  vite.config.ts
  tailwind.config.js
```

## 4. Data schema (TypeScript, matches `case_studies.json`)

```ts
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface CaseStudyOption {
  id: string;
  text: string;
  is_correct: boolean;
  explanation: string;
}

export interface Experimentation {
  objective: string;
  data_generation_code: string;   // Python source, ready to drop into the sandbox
  suggested_exploration: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  topics: string[];
  difficulty: Difficulty;
  scenario: string;
  question: string;
  options: CaseStudyOption[];      // always length 4
  correct_option_id: string;
  key_takeaway: string;
  common_misconception: string;
  experimentation: Experimentation;
}

export interface CaseStudiesFile {
  meta: {
    schema_version: string;
    description: string;
    difficulty_levels: Difficulty[];
    topics_covered: string[];
    count: number;
  };
  case_studies: CaseStudy[];
}
```

Write a small `validateCaseStudy()` check on load (each option array has
exactly 4 entries, exactly one `is_correct: true`, `correct_option_id`
matches it) and `console.warn` on a mismatch rather than crashing — this is
cheap insurance against a future hand-edited JSON entry breaking silently.

## 5. Core user flow (per case study)

1. **List page** — case cards show title, topic chips, difficulty badge, and
   a completed/not-completed indicator. Filterable by topic and difficulty.
2. **Detail page, pre-submit** — scenario and question shown, 4 options
   rendered as selectable cards. No answer is revealed yet. Nothing about
   correctness is shown until the user commits.
3. **Submit / lock in** — user picks one option and clicks "Lock in answer."
   Once locked, the choice can't be changed for that view (this is the whole
   point — it forces a real commitment before any feedback, rather than
   letting the user click through options until one looks right).
4. **Reveal** — on submit, show **all four** explanations at once (not just
   the one picked), with the correct option visually distinguished (e.g.
   green border/check) and the others neutral. Show `key_takeaway` and
   `common_misconception` below the options.
5. **Sandbox unlock** — a "Try it yourself" section becomes available only
   after the reveal (same reasoning as step 3 — sandbox access before
   commitment turns this into trial-and-error instead of reasoning). It
   shows `objective`, the code editor pre-filled with `data_generation_code`,
   a Run button, an output panel, and `suggested_exploration` as a
   persistent hint/callout the user can refer back to.
6. **Progress** — mark the case complete in `localStorage` at the reveal
   step; the list page reads this to show "X / 10 completed" and a
   per-topic/per-difficulty breakdown.

## 6. Pyodide integration — implementation notes

This is the part most likely to trip up a coding agent that hasn't worked
with Pyodide before, so be explicit about these points:

- **Run Pyodide inside a Web Worker**, not the main thread. This keeps the
  UI responsive while Python code runs, and — more importantly — it means a
  user's infinite loop or runaway computation doesn't freeze the whole tab.
- **Preload packages**: `numpy`, `pandas`, `scipy`, `scikit-learn`,
  `matplotlib` are all available as Pyodide's built-in packages (loaded via
  `pyodide.loadPackage(...)`); none of the sandbox code in
  `case_studies.json` needs anything beyond these.
- **Cold start**: first load of Pyodide + packages takes several seconds.
  Show a clear "booting Python environment…" loading state, and keep the
  worker alive across case studies so this cost is paid once per session,
  not once per case.
- **Capture stdout/stderr**: Pyodide supports redirecting output via
  `pyodide.setStdout({ batched: ... })` / `setStderr` — have the agent check
  Pyodide's current documentation for the exact API, since this has changed
  across versions and an outdated snippet will silently fail.
- **Matplotlib figures**: capturing a `matplotlib` figure and displaying it
  in the output panel also has a version-specific recommended pattern
  (rendering to a base64 PNG via the Agg backend is the general approach).
  Same instruction: check current Pyodide docs rather than trusting a
  possibly-stale example.
- **No true interrupt**: Pyodide can't cleanly interrupt a running Python
  call from the JS side mid-execution. The pragmatic MVP fix is a "Stop"
  button that terminates the Worker outright and spins up a fresh one —
  blunt, but sufficient, and far simpler than trying to build real
  cancellation.
- **Fresh namespace per case**: reset or reinitialize the Python globals
  when the user navigates to a different case study, so variables from one
  case study's `data_generation_code` can't leak into another.

## 7. Content pipeline

- `case_studies.json` lives in `public/case-studies/` and is fetched at
  runtime (or imported at build time — either works at this scale).
- Adding a new case study means appending one object to the array — no
  component code changes required, as long as it matches the schema.
- Longer-term, each case study could live in its own file
  (`cs-11.json`, `cs-12.json`, ...) with a build step that concatenates them,
  which makes diffs cleaner once you're routinely adding cases — not
  necessary for the first 10-20.

## 8. Build phases for the coding agent

Hand these to the agent **one phase at a time** and review the result before
starting the next one — letting an agent run through all six phases
unattended is how architecture decisions you'd want to weigh in on get made
without you.

**Phase 1 — Static shell**
Scaffold the Vite/React/TS/Tailwind project. Load `case_studies.json` and
render the list page (title, topics, difficulty — no filtering yet) and a
detail page showing scenario/question/options with no interactivity beyond
navigation. Deploy to Vercel/Netlify immediately, before adding any
complexity, to confirm the deployment pipeline works end to end.

**Phase 2 — Quiz interaction**
Make options selectable; implement the lock-in submit behavior; render all
four explanations plus `key_takeaway`/`common_misconception` on reveal.
Add `localStorage`-backed completion tracking and a progress summary on the
list page.

**Phase 3 — Filtering and navigation**
Add topic and difficulty filters to the list page. Add "next case study"
navigation from the detail page.

**Phase 4 — Pyodide sandbox**
Integrate Pyodide in a Web Worker with a loading state; embed CodeMirror
pre-filled with `data_generation_code`; wire Run → worker → stdout/error
capture → output panel; add matplotlib figure rendering; add the Stop/reset
control. Gate the sandbox behind having already submitted an answer.

**Phase 5 — Polish**
Loading and error states; mobile layout (the editor/output pair likely needs
to stack vertically, or move to tabs, on narrow screens); a visual pass so
it doesn't read as a generic templated quiz app — this matters more than it
sounds like if this doubles as a portfolio piece. Optional: a
privacy-respecting analytics tool (Plausible/Umami) mainly to see which
wrong answers people pick most often, which is genuinely useful signal for
improving the case studies themselves.

**Phase 6 — Optional, later**
Only once the static version is working and you want to grow past a
personal/portfolio tool: a lightweight backend (e.g. Supabase/Postgres) for
accounts, cross-device saved progress, a submission form for new case
studies, and aggregate stats on which wrong answers are most common across
all users — something `localStorage` alone can't give you.

## 9. What to hand the coding agent first

1. This document.
2. `case_studies.json`.
3. One instruction to start: *"Build Phase 1 only, then stop and show me the
   deployed static shell before continuing to Phase 2."*

## 10. Known risks to flag to the agent up front

- Pyodide cold-start latency — mitigate with lazy loading, caching the
  worker, and a clear loading state.
- Infinite loops in user-submitted code — mitigated by Worker isolation and
  a hard Stop/reset button, not true interruption.
- Matplotlib-in-Pyodide capture patterns change across versions — check
  current docs rather than reusing a possibly-outdated snippet.
- Side-by-side editor + output doesn't fit narrow mobile screens — plan for
  a stacked or tabbed layout there rather than trying to shrink both panes.
