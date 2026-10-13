import type { ReactElement, ReactNode } from "react";

// Deliberately tiny formatter for content text: blank lines separate
// paragraphs, `code`, **bold** and *italic* inline, "- " lines make bullet
// lists, ``` fences make code blocks. Nothing is parsed as HTML. Emphasis markers must hug non-space
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
      .flatMap((p, j) => paragraph(p, `${i}-${j}`));
  });
  return <div className={`space-y-2 ${className}`}>{blocks}</div>;
}

// A paragraph may mix text lines and "- " bullet lines; consecutive bullets
// become one list.
function paragraph(p: string, key: string): ReactElement[] {
  const out: ReactElement[] = [];
  let text: string[] = [];
  let bullets: string[] = [];
  const flushText = () => {
    if (text.length) out.push(<p key={`${key}-t${out.length}`} className="whitespace-pre-line">{inline(text.join("\n"))}</p>);
    text = [];
  };
  const flushBullets = () => {
    if (bullets.length) {
      out.push(
        <ul key={`${key}-l${out.length}`} className="list-disc pl-5 space-y-1 marker:text-[var(--color-text-faint)]">
          {bullets.map((b, k) => <li key={k}>{inline(b)}</li>)}
        </ul>,
      );
    }
    bullets = [];
  };
  for (const line of p.split("\n")) {
    if (line.startsWith("- ")) {
      flushText();
      bullets.push(line.slice(2));
    } else {
      flushBullets();
      text.push(line);
    }
  }
  flushText();
  flushBullets();
  return out;
}
