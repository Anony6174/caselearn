import { useState } from "react";
import type { CaseStudy } from "../types/caseStudy";

interface Props {
  cs: CaseStudy;
  onSubmit: (selectedId: string) => void;
}

export function QuestionPanel({ cs, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--color-text)] leading-snug">
        {cs.question}
      </h2>

      <div className="space-y-3">
        {cs.options.map((opt) => (
          <button
            key={opt.id}
            id={`option-${opt.id}`}
            onClick={() => setSelected(opt.id)}
            className={`option-card-selectable w-full text-left flex gap-3 items-start ${selected === opt.id ? "selected" : ""}`}
          >
            <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold uppercase transition-colors ${
              selected === opt.id
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}>
              {opt.id}
            </span>
            <span className="text-sm text-[var(--color-text)] leading-relaxed">{opt.text}</span>
          </button>
        ))}
      </div>

      <div className="pt-2">
        <button
          id="lock-in-btn"
          disabled={!selected}
          onClick={() => selected && onSubmit(selected)}
          className={`btn-primary w-full justify-center py-3 text-sm transition-all ${
            !selected ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
          }`}
        >
          🔒 Lock in answer
        </button>
        {!selected && (
          <p className="text-center text-xs text-[var(--color-text-muted)] mt-2">
            Select an option first
          </p>
        )}
      </div>
    </section>
  );
}
