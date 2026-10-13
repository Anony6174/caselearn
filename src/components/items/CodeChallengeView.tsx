import { useState } from "react";
import type { CodeChallengeItem } from "../../content/schema";
import { LANGUAGE_NAME } from "../../content/labels";
import { useChallengeRunner, type ChallengeRun } from "../../runners/useChallengeRunner";
import type { RecordAttempt } from "./types";
import { CodeEditor } from "../Sandbox/CodeEditor";
import { RichText } from "../RichText";
import { Note, ResultBanner } from "./ResultBanner";
import { Split } from "./Split";

const DRAFT_KEY = (id: string) => `caselearn_draft_v1:${id}`;

function loadDraft(id: string): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY(id));
  } catch {
    return null;
  }
}

function saveDraft(id: string, code: string | null) {
  try {
    if (code === null) localStorage.removeItem(DRAFT_KEY(id));
    else localStorage.setItem(DRAFT_KEY(id), code);
  } catch {
    /* drafts are a convenience; ignore storage errors */
  }
}

type TestState = "pending" | "pass" | "fail";

export function CodeChallengeView({ item, onAttempt }: { item: CodeChallengeItem; onAttempt: RecordAttempt }) {
  const runner = useChallengeRunner(item.language);
  const [code, setCode] = useState(() => loadDraft(item.id) ?? item.starter_code);
  const [lastRun, setLastRun] = useState<ChallengeRun | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"solved" | "gave-up" | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const testNames = item.test_names ?? [];
  const compiled = lastRun?.stage !== "compile";
  const stateOf = (name: string): { state: TestState; detail?: string } => {
    if (!lastRun || !compiled) return { state: "pending" };
    const r = lastRun.results.find((x) => x.name === name);
    if (!r) return { state: "fail", detail: lastRun.timedOut ? "Timed out before this test ran." : "Didn't run: the program crashed or exited first." };
    return { state: r.pass ? "pass" : "fail", detail: r.detail };
  };
  const passing = testNames.filter((n) => stateOf(n).state === "pass").length;

  function changeCode(next: string) {
    setCode(next);
    saveDraft(item.id, next === item.starter_code ? null : next);
  }

  async function handleRun() {
    setRunError(null);
    try {
      const run = await runner.run(code, item.harness);
      setLastRun(run);
      const allPass =
        run.stage === "run" && testNames.length > 0 && testNames.every((n) => run.results.find((r) => r.name === n)?.pass);
      if (allPass && outcome === null) {
        setOutcome("solved");
        onAttempt({ itemId: item.id, chosen: code, correct: true });
      }
    } catch (e) {
      setRunError((e as Error).message);
    }
  }

  function giveUp() {
    setOutcome("gave-up");
    setShowSolution(true);
    onAttempt({ itemId: item.id, chosen: code, correct: false });
  }

  function reset() {
    changeCode(item.starter_code);
    setLastRun(null);
    setRunError(null);
  }

  const main = (
    <div className="space-y-10">
      <section className="card p-6 sm:p-7">
        <h2 className="eyebrow mb-2">Task</h2>
        <RichText text={item.statement} className="text-[0.97rem] text-[var(--color-text)] leading-relaxed" />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="eyebrow">Tests</h2>
          {lastRun && compiled && (
            <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
              {passing} / {testNames.length} passing
            </span>
          )}
        </div>
        <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]" id="test-list">
          {testNames.map((name) => {
            const { state, detail } = stateOf(name);
            return (
              <li key={name} className="py-2.5 flex gap-3 items-start" data-state={state}>
                <span
                  className="mt-[0.3rem] w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[0.6rem] font-bold"
                  style={
                    state === "pass"
                      ? { background: "var(--color-good)", color: "var(--color-bg)" }
                      : state === "fail"
                        ? { background: "var(--color-bad)", color: "var(--color-bg)" }
                        : { border: "1px solid var(--color-border-strong)" }
                  }
                  aria-label={state}
                >
                  {state === "pass" ? "✓" : state === "fail" ? "✕" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--color-text)]">{name}</p>
                  {state === "fail" && detail && (
                    <pre className="mt-1 text-xs text-[var(--color-text-muted)] whitespace-pre-wrap break-words">{detail}</pre>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {outcome === null && (
        <section className="space-y-3">
          {item.hints.slice(0, hintsShown).map((h, i) => (
            <Note key={i} label={`Hint ${i + 1}`} tone="plain">
              <RichText text={h} />
            </Note>
          ))}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {hintsShown < item.hints.length && (
              <button id="hint-btn" className="btn btn-secondary" onClick={() => setHintsShown((n) => n + 1)}>
                {hintsShown === 0 ? "Show a hint" : "Another hint"} ({hintsShown}/{item.hints.length})
              </button>
            )}
            <button id="give-up-btn" className="link text-xs" onClick={giveUp}>
              Give up and show the solution (counts as not solved)
            </button>
          </div>
        </section>
      )}

      {outcome !== null && (
        <section className="space-y-8 animate-fade-in">
          {outcome === "solved" ? (
            <ResultBanner tone="correct" title={`All ${testNames.length} tests pass`}>
              Now compare your approach with the notes and reference below.
            </ResultBanner>
          ) : (
            <ResultBanner tone="incorrect" title="Solution revealed">
              This one comes back for review. Try writing it again from scratch later.
            </ResultBanner>
          )}
          <Note label="What this tests">
            <RichText text={item.discussion} />
          </Note>
          <section>
            <button className="link text-sm" onClick={() => setShowSolution((s) => !s)} id="toggle-solution">
              {showSolution ? "Hide" : "Show"} reference solution
            </button>
            {showSolution && (
              <div className="mt-3 animate-fade-in">
                <CodeEditor code={item.reference_solution} language={item.language} readOnly />
              </div>
            )}
          </section>
        </section>
      )}
    </div>
  );

  const busy = runner.status !== "ready";
  const side = (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="eyebrow">{LANGUAGE_NAME[item.language]}</h2>
        <span className="text-xs text-[var(--color-text-faint)]">
          {code !== item.starter_code ? "Draft saved in this browser" : "Starter code"}
        </span>
      </div>
      <CodeEditor code={code} onChange={changeCode} language={item.language} />
      <div className="flex flex-wrap items-center gap-2">
        <button id="run-tests-btn" className="btn btn-primary" onClick={handleRun} disabled={busy}>
          {runner.status === "running" ? "Running…" : "▶ Run tests"}
        </button>
        {runner.status === "running" && runner.stop && (
          <button className="btn btn-secondary !text-[var(--color-bad)]" onClick={runner.stop}>
            ■ Stop
          </button>
        )}
        <button className="btn btn-ghost" onClick={reset} disabled={runner.status === "running"}>
          Reset to starter
        </button>
      </div>

      {runner.status === "loading" && (
        <p className="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)]" role="status">
          <span className="spinner !w-4 !h-4" />
          {runner.loadingText}
        </p>
      )}
      {runner.status === "unavailable" && (
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed" role="status">
          {LANGUAGE_NAME[item.language]} challenges run with your local toolchain. Start the app with{" "}
          <code className="font-mono text-[0.85em] px-1 rounded bg-[var(--color-surface-2)]">npm run dev</code> to run tests.
        </p>
      )}

      <RunOutput run={lastRun} error={runError} />
    </section>
  );

  return <Split main={main} side={side} sideFirstOnMobile={false} />;
}

function RunOutput({ run, error }: { run: ChallengeRun | null; error: string | null }) {
  if (error) {
    return <pre className="code-surface p-3.5 text-[var(--color-bad)] whitespace-pre-wrap">{error}</pre>;
  }
  if (!run) return null;
  const notes: string[] = [];
  if (run.timedOut) notes.push("Stopped: the program took too long (infinite loop?).");
  if (run.stage === "compile") notes.push("Compilation failed:");
  return (
    <div className="space-y-2" id="run-output">
      <p className="eyebrow">Output</p>
      {notes.map((n) => (
        <p key={n} className="text-sm text-[var(--color-bad)]">{n}</p>
      ))}
      {run.output && <pre className="code-surface p-3.5 overflow-auto max-h-60 text-[var(--color-text)] whitespace-pre-wrap">{run.output}</pre>}
      {run.stderr && (
        <pre className="code-surface p-3.5 overflow-auto max-h-72 text-[var(--color-bad)] whitespace-pre-wrap text-xs">{run.stderr}</pre>
      )}
      {!run.output && !run.stderr && !run.timedOut && run.stage === "run" && (
        <p className="text-xs text-[var(--color-text-faint)]">No output besides the test results.</p>
      )}
    </div>
  );
}
