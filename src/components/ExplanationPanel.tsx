import type { CaseMcqItem } from "../content/schema";
import { Note, ResultBanner } from "./items/ResultBanner";
import { RichText } from "./RichText";

interface Props {
  cs: CaseMcqItem;
  selectedId: string;
}

function optionState(optId: string, correctId: string, selectedId: string) {
  if (optId === correctId) return "is-correct";
  if (optId === selectedId) return "is-wrong";
  return "";
}

export function ExplanationPanel({ cs, selectedId }: Props) {
  const isCorrect = selectedId === cs.correct_option_id;

  return (
    <div className="space-y-8 animate-fade-in">
      <ResultBanner tone={isCorrect ? "correct" : "incorrect"} title={isCorrect ? "Correct" : "Not quite"}>
        {isCorrect
          ? "Now read why the other options don't fit."
          : `The answer is option ${cs.correct_option_id.toUpperCase()}. Here's why each option does or doesn't fit.`}
      </ResultBanner>

      <section className="space-y-2.5">
        <h3 className="eyebrow">Every option, explained</h3>
        {cs.options.map((opt) => (
          <div key={opt.id} className={`option ${optionState(opt.id, cs.correct_option_id, selectedId)}`}>
            <span className="option-key">{opt.id === cs.correct_option_id ? "✓" : opt.id}</span>
            <div className="space-y-1 pt-0.5 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)]">
                {opt.text}
                {opt.id === selectedId && <span className="ml-2 text-xs font-normal text-[var(--color-text-faint)]">your pick</span>}
              </p>
              <RichText text={opt.explanation} className="text-sm text-[var(--color-text-muted)] leading-relaxed" />
            </div>
          </div>
        ))}
      </section>

      <Note label="Key takeaway">
        <RichText text={cs.key_takeaway} />
      </Note>
      <Note label="Common misconception" tone="warn">
        <RichText text={cs.common_misconception} />
      </Note>
    </div>
  );
}
