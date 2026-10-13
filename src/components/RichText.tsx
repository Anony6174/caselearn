import type { ReactNode } from "react";

// Deliberately tiny formatter for content text: blank lines separate
// paragraphs, `code`, **bold** and *italic* inline, ``` fences make code
// blocks. Nothing is parsed as HTML. Emphasis markers must hug non-space
// text, so prose like `int* p` or `x * y` outside backticks is left alone.

const INLINE = /(`[^`\n]+`|\*\*[^\s*](?:[^*\n]*[^\s*])?\*\*|\*[^\s*](?:[^*\n]*[^\s*])?\*)/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (i % 2 === 0) return part; // odd indexes are the captured tokens
    if (part.startsWith("`")) {
      return (
        <code key={i} className="font-mono text-[0.84em] px-[0.3em] py-[0.1em] rounded-[5px] bg-[var(--color-surface-2)] text-[var(--color-text)]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    return <em key={i}>{part.slice(1, -1)}</em>;
  });
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/(```[\s\S]*?```)/g).flatMap((chunk, i) => {
    if (chunk.startsWith("```")) {
      const body = chunk.replace(/^```[^\n]*\n?/, "").replace(/```$/, "");
      return [
        <pre key={`c${i}`} className="code-surface p-3.5 overflow-x-auto text-[var(--color-text)]">
          {body.replace(/\n$/, "")}
        </pre>,
      ];
    }
    return chunk
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, j) => (
        <p key={`p${i}-${j}`} className="whitespace-pre-line">
          {inline(p)}
        </p>
      ));
  });
  return <div className={`space-y-2 ${className}`}>{blocks}</div>;
}
