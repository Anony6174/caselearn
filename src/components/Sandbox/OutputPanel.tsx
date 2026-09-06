import { useEffect, useRef } from "react";
import type { OutputItem } from "../../hooks/usePyodideWorker";

interface Props {
  output: OutputItem[];
  isRunning: boolean;
}

export function OutputPanel({ output, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  if (output.length === 0 && !isRunning) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-[var(--color-text-muted)] italic">
        Output will appear here after you run the code.
      </div>
    );
  }

  return (
    <div className="min-h-[80px] max-h-[400px] overflow-auto rounded-xl border border-[var(--color-border)] bg-[#0d0d14] p-4 space-y-1 font-mono text-sm">
      {output.map((item, i) => {
        if (item.kind === "figure") {
          return (
            <img
              key={i}
              src={`data:image/png;base64,${item.data}`}
              alt="matplotlib output"
              className="max-w-full rounded-lg mt-2"
            />
          );
        }
        return (
          <pre
            key={i}
            className={`whitespace-pre-wrap break-words leading-relaxed ${
              item.kind === "stderr"
                ? "text-[var(--color-advanced)]"
                : "text-[#c8e6c9]"
            }`}
          >
            {item.text}
          </pre>
        );
      })}
      {isRunning && (
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] pt-1">
          <div className="w-3 h-3 border border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Running…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
