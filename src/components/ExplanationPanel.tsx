import type { CaseStudy } from "../types/caseStudy";

interface Props {
  cs: CaseStudy;
  selectedId: string;
}

function optionClass(optId: string, correctId: string, selectedId: string) {
  if (optId === correctId) return "option-card-correct";
  if (optId === selectedId) return "option-card-wrong";
  return "option-card-neutral";
}

export function ExplanationPanel({ cs, selectedId }: Props) {
  const isCorrect = selectedId === cs.correct_option_id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Result banner */}
      <div className={`rounded-xl px-5 py-4 border flex items-center gap-3 ${
        isCorrect
          ? "bg-[rgba(52,211,153,0.08)] border-[rgba(52,211,153,0.4)] text-[var(--color-beginner)]"
          : "bg-[rgba(248,113,113,0.08)] border-[rgba(248,113,113,0.35)] text-[var(--color-advanced)]"
      }`}>
        <span className="text-2xl">{isCorrect ? "✓" : "✗"}</span>
        <div>
          <p className="font-semibold text-sm">{isCorrect ? "Correct!" : "Not quite."}</p>
          <p className="text-xs opacity-80 mt-0.5">
            {isCorrect
              ? "Great reasoning — see why each option works or doesn't below."
              : `The correct answer was option ${cs.correct_option_id.toUpperCase()}.`}
          </p>
        </div>
      </div>

      {/* All 4 explanations */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">All Options Explained</h3>
        {cs.options.map((opt) => (
          <div
            key={opt.id}
            className={`${optionClass(opt.id, cs.correct_option_id, selectedId)} flex gap-3 items-start`}
          >
            <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold uppercase ${
              opt.id === cs.correct_option_id
                ? "bg-[var(--color-beginner)] text-[#0a0a0f]"
                : opt.id === selectedId
                ? "bg-[var(--color-advanced)] text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}>
              {opt.id === cs.correct_option_id ? "✓" : opt.id}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--color-text)]">{opt.text}</p>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{opt.explanation}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Key takeaway */}
      <section className="card p-5 space-y-2 border-l-2 border-l-[var(--color-accent)]">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">Key Takeaway</h3>
        <p className="text-sm text-[var(--color-text)] leading-relaxed">{cs.key_takeaway}</p>
      </section>

      {/* Common misconception */}
      <section className="card p-5 space-y-2 border-l-2 border-l-[var(--color-intermediate)]">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-intermediate)]">Common Misconception</h3>
        <p className="text-sm text-[var(--color-text)] leading-relaxed">{cs.common_misconception}</p>
      </section>
    </div>
  );
}
