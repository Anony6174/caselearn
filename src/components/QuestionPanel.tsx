import { useState } from "react";

interface Props {
  question: string;
  options: { id: string; text: string }[];
  /** Render option text as preformatted code (e.g. program output). */
  mono?: boolean;
  onSubmit: (selectedId: string) => void;
}

export function QuestionPanel({ question, options, mono = false, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <h2 className="text-[1.05rem] font-medium text-[var(--color-text)] leading-snug">{question}</h2>

      <div className="space-y-2.5" role="radiogroup" aria-label={question}>
        {options.map((opt) => (
          <button
            key={opt.id}
            id={`option-${opt.id}`}
            role="radio"
            aria-checked={selected === opt.id}
            onClick={() => setSelected(opt.id)}
            className={`option ${selected === opt.id ? "is-selected" : ""}`}
          >
            <span className="option-key">{opt.id}</span>
            {mono ? (
              <pre className="text-[0.85rem] text-[var(--color-text)] whitespace-pre-wrap pt-0.5">{opt.text}</pre>
            ) : (
              <span className="text-sm text-[var(--color-text)] leading-relaxed pt-0.5">{opt.text}</span>
            )}
          </button>
        ))}
      </div>

      <LockInButton disabled={!selected} hint="Select an option first" onClick={() => selected && onSubmit(selected)} />
    </section>
  );
}

export function LockInButton({ disabled, hint, onClick }: { disabled: boolean; hint: string; onClick: () => void }) {
  return (
    <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
      <button id="lock-in-btn" disabled={disabled} onClick={onClick} className="btn btn-primary px-6">
        Lock in answer
      </button>
      <span className="text-xs text-[var(--color-text-faint)]">
        {disabled ? hint : "You can't change it after this."}
      </span>
    </div>
  );
}
