import { useState } from "react";
import type { Experimentation } from "../../types/caseStudy";
import { usePyodideWorker } from "../../hooks/usePyodideWorker";
import { CodeEditor } from "./CodeEditor";
import { OutputPanel } from "./OutputPanel";

interface Props {
  experimentation: Experimentation;
  caseId: string;
}

/**
 * The JSON code has the actual computation lines commented out under
 * "# Try it yourself:" so users can see the structure. We auto-uncomment
 * them so the code runs out of the box.
 */
function makeRunnable(raw: string): string {
  const lines = raw.split("\n");
  let pastMarker = false;
  return lines
    .map((line) => {
      const trimmed = line.trim();
      // Detect the "Try it yourself:" comment header
      if (trimmed.startsWith("# Try it yourself") && trimmed.endsWith(":")) {
        pastMarker = true;
        return "# ── Try it yourself ──────────────────────────────";
      }
      // Uncomment code lines inside that block
      if (pastMarker && line.startsWith("# ")) {
        return line.slice(2);
      }
      return line;
    })
    .join("\n");
}

export function SandboxPanel({ experimentation, caseId }: Props) {
  const initialCode = makeRunnable(experimentation.data_generation_code);
  const [code, setCode] = useState(initialCode);
  const { status, loadingText, output, run, stop, clearOutput } = usePyodideWorker();

  const isLoading = status === "loading" || status === "idle";
  const isRunning = status === "running";
  const isReady = status === "ready";

  function handleRun() {
    if (!isReady) return;
    run(code);
  }

  function handleStop() {
    stop();
  }

  function handleReset() {
    setCode(initialCode);
    clearOutput();
  }

  return (
    <section className="space-y-4" id={`sandbox-${caseId}`}>
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className="text-lg mt-0.5">🧪</span>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Try it yourself</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
            {experimentation.objective}
          </p>
        </div>
      </div>

      {/* Pyodide cold-start notice */}
      {isLoading && (
        <div className="flex items-center gap-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3">
          <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm text-[var(--color-text-muted)]">{loadingText}</p>
        </div>
      )}

      {/* Side-by-side: Editor (left) | Output (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {/* Left — editor + controls */}
        <div className="flex flex-col gap-3">
          <CodeEditor
            code={code}
            onChange={setCode}
            disabled={isRunning || isLoading}
          />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="sandbox-run-btn"
              onClick={handleRun}
              disabled={!isReady}
              className={`btn-primary text-sm py-2 px-5 ${
                !isReady ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
              }`}
            >
              ▶ Run
            </button>

            {isRunning && (
              <button
                id="sandbox-stop-btn"
                onClick={handleStop}
                className="text-sm py-2 px-4 rounded-lg border border-[var(--color-advanced)] text-[var(--color-advanced)] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
              >
                ■ Stop
              </button>
            )}

            <button
              id="sandbox-reset-btn"
              onClick={handleReset}
              disabled={isRunning || isLoading}
              className="text-sm py-2 px-4 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              ↺ Reset
            </button>

            {output.length > 0 && !isRunning && (
              <button
                onClick={clearOutput}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors ml-auto"
              >
                Clear ✕
              </button>
            )}
          </div>
        </div>

        {/* Right — output */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            Output
          </p>
          <OutputPanel output={output} isRunning={isRunning} />
        </div>
      </div>

      {/* Suggested exploration */}
      <div className="bg-[rgba(124,106,247,0.06)] border border-[rgba(124,106,247,0.2)] rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
          💡 Suggested exploration
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          {experimentation.suggested_exploration}
        </p>
      </div>
    </section>
  );
}
