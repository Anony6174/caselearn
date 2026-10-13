import { useEffect, useRef } from "react";
import type { OutputItem } from "../../hooks/usePyodideWorker";

interface Props {
  output: OutputItem[];
  isRunning: boolean;
  /** Whether the code has been run since the output was last cleared. */
  hasRun?: boolean;
}

export function OutputPanel({ output, isRunning, hasRun = false }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the newest output in view by scrolling the box itself, not the page.
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [output]);

  if (output.length === 0 && !isRunning) {
    return (
      <div className="flex items-center justify-center min-h-[96px] rounded-xl border border-dashed border-[var(--color-border-strong)] text-xs text-[var(--color-text-faint)]">
        {hasRun ? "Ran without errors. Nothing was printed; add print(...) to see values." : "Output appears here when you run the code."}
      </div>
    );
  }

  return (
    <div ref={boxRef} className="code-surface min-h-[96px] max-h-[320px] overflow-auto p-4 space-y-1">
      {output.map((item, i) => {
        if (item.kind === "figure") {
          return (
            <img
              key={i}
              src={`data:image/png;base64,${item.data}`}
              alt="matplotlib output"
              className="max-w-full rounded-lg mt-2 bg-white"
            />
          );
        }
        return (
          <pre
            key={i}
            className={`whitespace-pre-wrap break-words leading-relaxed ${
              item.kind === "stderr"
                ? "text-[var(--color-bad)]"
                : "text-[var(--color-text)]"
            }`}
          >
            {item.text}
          </pre>
        );
      })}
      {isRunning && (
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] pt-1">
          <div className="spinner !w-3 !h-3 !border" />
          <span className="text-xs">Running…</span>
        </div>
      )}
    </div>
  );
}
