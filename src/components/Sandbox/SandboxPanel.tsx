import { useState } from "react";
import type { CaseMcqItem } from "../../content/schema";

export type Experimentation = NonNullable<CaseMcqItem["experimentation"]>;
import { usePyodideWorker } from "../../hooks/usePyodideWorker";
import { CodeEditor } from "./CodeEditor";
import { OutputPanel } from "./OutputPanel";
import { RichText } from "../RichText";
import { makeRunnable } from "../../content/runnable";

interface Props {
  experimentation: Experimentation;
  caseId: string;
}

export function SandboxPanel({ experimentation, caseId }: Props) {
  const initialCode = makeRunnable(experimentation.data_generation_code);
  const [code, setCode] = useState(initialCode);
  const [hasRun, setHasRun] = useState(false);
  const { status, loadingText, output, run, stop, clearOutput } = usePyodideWorker();

  const isLoading = status === "loading" || status === "idle";
  const isRunning = status === "running";
  const isReady = status === "ready";

  function handleRun() {
    if (!isReady) return;
    run(code);
    setHasRun(true);
  }

  function handleStop() {
    stop();
  }

  function handleReset() {
    setCode(initialCode);
    clearOutput();
    setHasRun(false);
  }

  return (
    <section className="space-y-4" id={`sandbox-${caseId}`}>
      <div>
        <h2 className="serif text-[1.75rem] leading-tight text-[var(--color-text)]">Try it yourself</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed">{experimentation.objective}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]" role="status">
          <div className="spinner !w-4 !h-4" />
          {loadingText}
        </div>
      )}

      <CodeEditor code={code} onChange={setCode} disabled={isRunning || isLoading} />

      <div className="flex flex-wrap items-center gap-2">
        <button id="sandbox-run-btn" onClick={handleRun} disabled={!isReady} className="btn btn-primary">
          ▶ Run
        </button>
        {isRunning && (
          <button id="sandbox-stop-btn" onClick={handleStop} className="btn btn-secondary !text-[var(--color-bad)]">
            ■ Stop
          </button>
        )}
        <button id="sandbox-reset-btn" onClick={handleReset} disabled={isRunning || isLoading} className="btn btn-ghost">
          Reset code
        </button>
        {output.length > 0 && !isRunning && (
          <button onClick={() => { clearOutput(); setHasRun(false); }} className="btn btn-ghost ml-auto">
            Clear output
          </button>
        )}
      </div>

      <div>
        <p className="eyebrow mb-1.5">Output</p>
        <OutputPanel output={output} isRunning={isRunning} hasRun={hasRun} />
      </div>

      <div className="note note-accent">
        <h3 className="eyebrow mb-1.5">Explore</h3>
        <RichText text={experimentation.suggested_exploration} className="text-sm text-[var(--color-text)] leading-relaxed" />
      </div>
    </section>
  );
}

/** Shown in the code panel before the user has committed to an answer. */
export function SandboxLocked() {
  return (
    <section className="rounded-[14px] border border-dashed border-[var(--color-border-strong)] px-6 py-12 text-center" id="sandbox-locked">
      <div className="mx-auto w-9 h-9 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)]" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <h2 className="serif text-2xl mt-4 text-[var(--color-text)]">Python sandbox</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xs mx-auto leading-relaxed">
        Unlocks once you lock in an answer, so you reason it out first and then check it by running the numbers.
      </p>
    </section>
  );
}
