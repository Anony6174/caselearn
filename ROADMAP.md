# CaseLearn Roadmap — Learning Plan + Platform Plan

Two goals, one system:

1. **Learn for placements, with real understanding** — DSA, CS fundamentals
   (OS, DBMS, CN, OOP, computer architecture), C++, Python, x86-64 assembly,
   plus the existing ML/stats material.
2. **Grow CaseLearn** into the tool you study *with*: more question types,
   more languages in the coding window, and a review loop that targets what
   you got wrong.

The rule that ties them together: **writing questions *is* how you study.**
After you study a topic, write 3–5 CaseLearn items on it. You can't write a
good wrong option and its explanation without understanding why it's wrong.
This keeps platform work from eating your prep time, because the content you
add is the prep.

> Assumptions: about 5 months to placements, about 3–4 focused hours a day,
> target roles are SDE (and possibly ML). Stretch or squeeze the weeks to
> fit. The order matters more than the dates.

---

## Part A — How to study so it sticks (not rote)

| Principle | What you do | How CaseLearn supports it |
|---|---|---|
| **Predict before you check** | Before running code or reading an answer, write down what you expect. | Lock-in before reveal (already built), predict-the-output items |
| **Rate your confidence** | Mark guess / somewhat / sure before you reveal. | Confident and wrong = a misconception, so it goes to the top of the review queue |
| **Explain it back (Feynman)** | Write *why* in 2–3 sentences before you see the explanation. | "Your reasoning" box, shown next to the official explanation |
| **Build the thing** | Implement a mini shell, a hash map, a scheduler, a socket server. | Code challenges + sandboxes |
| **Spaced review** | Revisit misses on days 1, 3, 7, 16, 35. | Leitner review queue |
| **Mix topics in practice** | Mock sessions mix topics without labels, like a real interview. | Mock-interview mode |
| **Verify with experiments** | Don't trust an explanation you can test. | Sandboxes: time it, plot it, look at the assembly |

**Weekly rhythm (Mon–Sat):**
- 2 h — DSA in C++ (LeetCode / Striver A2Z sheet; CaseLearn is *not* a replacement for an online judge)
- 1 h — this week's fundamentals topic (read, then experiment)
- 30–45 min — write CaseLearn items for what you learned, or build one platform feature
- **Sunday:** clear the review queue + one 45-min mixed mock

---

## Part B — Learning roadmap (~20 weeks)

DSA in C++ runs **every week** next to the fundamentals track below.

| Weeks | Fundamentals focus | Main resource | Build / experiment |
|---|---|---|---|
| 1–2 | **C++ core**: references vs pointers, stack vs heap, RAII, constructors, rule of 0/3/5, `const`, STL containers | learncpp.com | Write your own `Vector<T>` with growth + iterators |
| 3 | **Data representation**: two's complement, overflow, bit tricks, floating point (`0.1+0.2`) | CS:APP ch. 2 | CS:APP *Data Lab* |
| 4–5 | **x86-64 assembly (reading, not writing)**: registers, `mov/lea`, flags + jumps, System V calling convention, stack frames, how loops/`if`/`switch`/arrays/structs/virtual calls compile, `-O0` vs `-O2` | CS:APP ch. 3 + Compiler Explorer (godbolt.org) | CS:APP *Bomb Lab* (the best single exercise for this) |
| 6 | **C++ deeper**: move semantics, smart pointers, vtables, templates basics, undefined behaviour | learncpp + Godbolt | Look at the asm for a virtual call vs a direct call |
| 7–9 | **Operating systems**: processes/threads, context switch, scheduling, mutex/semaphore/condvar, deadlock, virtual memory, paging, TLB, page faults, page replacement, `fork/exec`, syscalls | OSTEP (free online) | Mini shell in C++; producer–consumer; scheduling simulator in the Python sandbox |
| 10 | **Computer architecture**: cache hierarchy, locality, pipelining, branch prediction | CS:APP ch. 5–6 | Time row- vs column-major traversal; sorted vs unsorted branch test |
| 11–12 | **DBMS + SQL**: keys, normalization, ACID, isolation levels + anomalies, B+ tree indexes, joins, locking vs MVCC; SQL incl. window functions | CMU 15-445 lectures + SQL sandbox | 30 SQL problems (Nth highest salary, running totals, gaps) |
| 13–14 | **Computer networks**: layers, TCP vs UDP, handshake, flow vs congestion control, DNS, HTTP/HTTPS/TLS, "what happens when you type a URL" | Kurose & Ross; Beej's Guide | TCP chat server in C++ or Python |
| 15 | **OOP + LLD**: composition vs inheritance, SOLID, common patterns, parking-lot / LRU-cache style design | Refactoring.Guru | LRU cache, parking lot in C++ |
| 16 | **Python internals**: everything-is-an-object, references, mutability, LEGB/closures, generators, decorators, context managers, GIL, threads vs processes vs asyncio, refcount + GC, dict/list internals | *Fluent Python*; pythontutor.com | Run the CaseLearn predict-output items |
| 17 | **ML/stats** (if targeting ML roles): go back through the existing 40 cases, then write the beginner ones that are missing | existing content | — |
| 18–20 | **Interview mode**: mixed mocks, review-queue zero, weak topics from the stats page, projects + resume story | — | — |

### Critical questions — seed content (answer each in your own words)

These are "why" questions, where memorising the definition isn't enough.
Each one becomes a CaseLearn item.

**OS**
- Why is a thread switch cheaper than a process switch? What exactly *doesn't* need to change?
- Walk through a page fault from the faulting instruction to resumption.
- Why doesn't disabling interrupts give mutual exclusion on a multicore CPU?
- Can you deadlock with a single mutex? (Yes, by locking it twice. Why?)
- Why can `fork()` be fast even for a 4 GB process? (copy-on-write)

**DBMS**
- Why are B+ trees used instead of hash indexes for most indexes? When is a hash index better?
- Why does adding an index slow down writes, and when is that worth it?
- Which isolation level prevents phantom reads, and how does MVCC let readers avoid blocking writers?
- Why might normalization hurt read performance, and when do you denormalize?

**Networks**
- Why a 3-way handshake and not 2? What breaks with 2?
- Why does `TIME_WAIT` exist, and why does it last 2×MSL?
- Flow control vs congestion control: who is being protected in each?
- Why did HTTP/3 move to UDP (QUIC)? (TCP head-of-line blocking)

**C++**
- Why is `vector::push_back` amortized O(1), and why does it invalidate iterators?
- Why must a polymorphic base class have a virtual destructor? Show the leak.
- What does `std::move` actually do? (Nothing at runtime; it's a cast.)
- Why is `i++ + i++` undefined, not just "unspecified"?

**Python**
- Why is `def f(x=[])` a bug?
- Why is `a += [1]` different from `a = a + [1]` when `a` is aliased?
- Why don't threads speed up CPU-bound Python, but do speed up I/O-bound work?
- Why does `256 is 256` behave differently from `1000 is 1000` in some contexts?

**Assembly / architecture**
- Why do compilers use `lea` for arithmetic?
- How does `x / 2` compile for a signed `int` vs an `unsigned`, and why the difference?
- Why can summing a sorted array be faster than summing the same array unsorted?
- Why is column-major traversal of a C++ 2-D array slow?

---

## Part C — Platform implementation plan

### What's there today
- 40 ML/stats MCQ cases, Pyodide sandbox in a Web Worker, filters, `localStorage` progress.
- **Problems to fix first:**
  - Root-level `case_studies*.json` / `batch_4_case_studies.json` are stale copies, and two of them use the same IDs (`cs-21..30`). The real content is in `public/case-studies/case_studies.json`.
  - `useProgress` marks an item complete even when the answer was wrong, so the app can't tell you what to review.
  - Difficulty is skewed: 4 beginner, 12 intermediate, 24 advanced.
  - Only one question type, one track, one language.

### Target architecture

```
content/                         # source of truth: one file per item
  ml-stats/<topic>/mls-corr-001.json
  os/scheduling/os-sched-001.json
  cpp/move-semantics/cpp-move-002.json
  ...
scripts/
  build-content.ts               # validate (zod) -> verify -> bundle
public/content/                  # generated, gitignored
  index.json                     # tracks, topics, counts
  <track>.json
src/
  types/content.ts               # discriminated-union item schema
  runners/                       # one interface, many languages
    types.ts
    pyodide.ts   sqljs.ts   godbolt.ts
  hooks/useRunner.ts  useProgress.ts (v2)  useReviewQueue.ts
  pages/
    TracksPage  TrackPage  ItemPage  ReviewPage  PlaygroundPage  StatsPage
  components/items/              # one renderer per item type
    CaseMcq  PredictOutput  Concept  CodeChallenge
  components/Sandbox/            # editor + output, language-agnostic
  components/AsmView.tsx         # C++ <-> assembly side by side
```

### Content schema (v2)

```ts
type Track = "ml-stats" | "dsa" | "cpp" | "python" | "asm" | "arch"
           | "os" | "dbms" | "cn" | "oop";
type Lang  = "python" | "cpp" | "sql" | "asm";

interface BaseItem {
  id: string;                 // "<track-abbr>-<topic-abbr>-NNN", unique, never renumbered
  type: ItemType;
  track: Track;
  topics: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites?: string[];   // item ids
  sources?: { title: string; url: string }[];
  verified: boolean;          // you personally checked it (see "content quality")
}

// existing format, unchanged apart from base fields
interface CaseMcqItem extends BaseItem { type: "case-mcq"; scenario; question; options; key_takeaway; common_misconception; experimentation? }

// "what does this print?" — answer is COMPUTED at build time, never hand-written
interface PredictOutputItem extends BaseItem {
  type: "predict-output"; language: "python" | "cpp";
  code: string; expected_output?: string;   // filled in by build script
  distractors?: string[];                    // optional MCQ mode
  explanation: string;
}

// open "why" question: write your answer, then self-grade against key points
interface ConceptItem extends BaseItem {
  type: "concept"; prompt: string;
  key_points: string[]; model_answer: string; follow_ups: string[];
}

// write code that passes tests
interface CodeChallengeItem extends BaseItem {
  type: "code-challenge"; language: Lang;
  statement: string; starter_code: string;
  tests: { stdin: string; expected_stdout: string; hidden?: boolean }[];
  hints: string[]; reference_solution: string; complexity: string;
}
```

### Phases

Each phase is about one week of part-time work. Finish and deploy each one
before starting the next.

**Phase 0 — Clean foundation (2–3 days)** — ✅ done except deploy
- Move the 40 cases into `content/ml-stats/...` (one file each); delete the stale root batch files.
- `scripts/build-content.ts`: zod-validate every item, check IDs are unique, emit `public/content/*.json`; run it as `prebuild`.
- Add Vitest + a GitHub Actions job running `lint`, `build`, and the content validation.
- Progress v2: store attempts (`{itemId, chosen, correct, confidence, ts}`), migrate `caselearn_progress_v1`, add JSON export/import so progress can be backed up.
- Deploy (Vercel/Netlify).

**Phase 1 — Tracks + new question types** — ✅ done
- Routes: `/` tracks → `/t/:track` → `/item/:id`.
- Renderers for `predict-output` and `concept` (self-grading checklist against `key_points`).
- Build-time verification: the build script runs every `predict-output` snippet (local `python3` / `g++`) and writes `expected_output`. Answers are never typed by hand, so they can't be wrong.
- Content: 10 items each for C++, Python, and OS from the critical-questions list above.

**Phase 2 — Learning loop**
- Before lock-in: confidence picker + optional "your reasoning" box; after reveal, show your reasoning next to the explanation.
- Review queue (Leitner boxes at 1/3/7/16/35 days). A wrong answer resets to box 1; confident-and-wrong is flagged as a misconception.
- `/review` page and a "due today" count on the home page.
- Stats page: accuracy by track/topic, and confidence calibration (how often "sure" was actually right).
- Mock mode: N random items across tracks, timed, topic labels hidden.

**Phase 3 — Multi-language coding window**
- `Runner` interface; move the current Pyodide code behind it:
  ```ts
  interface Runner {
    lang: Lang;
    init(onStatus): Promise<void>;
    run(req: { code: string; stdin?: string }, onEvent): Promise<{ exitCode: number }>;
    stop(): void;
  }
  ```
- **SQL**: `sql.js` (SQLite in WASM, runs fully in the browser) with seed schemas (employees, orders, …); results shown as a table.
- **C++**: Compiler Explorer (godbolt.org) REST API — `POST /api/compiler/<id>/compile` with `filters.execute = true` returns both program output *and* assembly.
  - Spike first: confirm CORS from the browser works; if not, add a small Vercel/Netlify function as a proxy.
  - Only send requests when Run is clicked (no compiling as you type), cache results by hash of source + flags, and show a notice that the code is sent to godbolt.org.
  - Fallback/alternative: self-host Piston or Judge0 later if limits become a problem.
- CodeMirror language modes: `@codemirror/lang-cpp`, `@codemirror/lang-sql`, and the `gas` legacy mode for assembly.
- Editor drafts saved per item in `localStorage`; stdin box; `/playground/:lang` page.
- `code-challenge` renderer: run each test, show pass/fail with a diff; hidden tests are only revealed after you pass.

**Phase 4 — C++ ↔ Assembly view**
- `AsmView`: C++ on the left, assembly on the right, colour-matched by source line (Godbolt returns `source.line` per asm line). Hovering one side highlights the other.
- Toggles for `-O0 / -O1 / -O2`, gcc vs clang.
- Asm-track items: "which C++ produced this asm?", "what does this function return for input 5?", "why did `-O2` remove this loop?"
- This is the feature that makes the project stand out on a resume; it's also where C++ and assembly connect for you.

**Phase 5 — Visual tools (build each one in the week you study its topic)**
- First build each as a Python-sandbox exercise (simulate + matplotlib). Only turn it into a polished React widget if you keep coming back to it.
- CPU scheduling Gantt chart (FCFS/SJF/RR/priority), page replacement (FIFO/LRU/Optimal + Belady's anomaly), Banker's algorithm, cache simulator, TCP sliding window, B+ tree insert visualiser.

**Phase 6 — Optional, later**
- Accounts + cross-device sync (Supabase).
- LLM feedback on your "your reasoning" answers (needs a backend to keep the API key secret).
- Aggregate "most-picked wrong answer" stats.

### Content quality rules
- Most of the existing content looks AI-generated. A wrong answer key teaches you the wrong thing confidently, so **re-check every item before marking it `verified: true`**, ideally by running its experiment.
- Prefer answers that come from running code (predict-output, code challenges) over hand-written ones.
- Every MCQ wrong option should be a *real* misconception, not obviously silly.
- Balance difficulty: aim for roughly 30% beginner / 45% intermediate / 25% advanced per track.

### Content targets by end of plan

| Track | Items | Main types |
|---|---|---|
| ml-stats | 60 | case-mcq |
| os | 50 | concept, case-mcq, Python sim challenges |
| dbms | 40 | concept, SQL challenges |
| cn | 35 | concept, case-mcq |
| cpp | 50 | predict-output, code-challenge |
| python | 40 | predict-output |
| asm / arch | 35 | asm-view items, predict-output |
| oop / lld | 20 | concept, code-challenge |

---

## Start here
1. Phase 0 (clean up + progress v2 + CI + deploy).
2. Begin the week-1 C++ track at the same time; write your first 10 C++ predict-output items as you go.
3. Then Phase 1.
