import { useState } from "react";
import type { ConceptItem } from "../../content/schema";
import type { RecordAttempt } from "./types";
import { LockInButton } from "../QuestionPanel";
import { RichText } from "../RichText";
import { Note, ResultBanner } from "./ResultBanner";

// Short enough not to be a chore, long enough that "idk" doesn't count as an answer.
const MIN_ANSWER_CHARS = 40;

type Phase =
  | { kind: "writing" }
  | { kind: "grading"; answer: string }
  | { kind: "done"; answer: string; covered: number; skipped: boolean };

export function ConceptView({ item, onAttempt }: { item: ConceptItem; onAttempt: RecordAttempt }) {
  const [phase, setPhase] = useState<Phase>({ kind: "writing" });
  const [answer, setAnswer] = useState("");
  const [ticked, setTicked] = useState<boolean[]>(() => item.key_points.map(() => false));
  const total = item.key_points.length;

  function finishGrading(ans: string) {
    const covered = ticked.filter(Boolean).length;
    setPhase({ kind: "done", answer: ans, covered, skipped: false });
    onAttempt({ itemId: item.id, chosen: ans, correct: covered === total, score: covered / total });
  }

  function skip() {
    setPhase({ kind: "done", answer: "", covered: 0, skipped: true });
    onAttempt({ itemId: item.id, chosen: "", correct: false, score: 0 });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <section className="card p-6 sm:p-7">
        <h2 className="eyebrow mb-2">Question</h2>
        <RichText text={item.prompt} className="text-[1.02rem] text-[var(--color-text)] leading-relaxed" />
      </section>

      {phase.kind === "writing" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-[1.05rem] font-medium text-[var(--color-text)]">Your answer</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Explain it as you would to an interviewer, in your own words. Then you'll check it against the key points.
            </p>
          </div>
          <textarea
            id="concept-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={7}
            className="input text-[0.95rem] leading-relaxed"
            placeholder="Because…"
          />
          <LockInButton
            disabled={answer.trim().length < MIN_ANSWER_CHARS}
            hint={`Write at least a couple of sentences (${answer.trim().length}/${MIN_ANSWER_CHARS})`}
            onClick={() => setPhase({ kind: "grading", answer })}
          />
          <button id="concept-skip" onClick={skip} className="link text-xs">
            I don't know yet. Show me (counts as wrong, so it comes back for review)
          </button>
        </section>
      )}

      {phase.kind !== "writing" && !(phase.kind === "done" && phase.skipped) && (
        <section>
          <h2 className="eyebrow mb-1.5">Your answer</h2>
          <p className="text-[0.95rem] text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed">{phase.answer}</p>
        </section>
      )}

      {phase.kind === "grading" && (
        <section className="space-y-3 animate-fade-in">
          <div>
            <h2 className="text-[1.05rem] font-medium text-[var(--color-text)]">Grade yourself honestly</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Tick a point only if your answer actually says it, not if you "knew it but didn't write it".
            </p>
          </div>
          <ul className="space-y-2">
            {item.key_points.map((kp, i) => (
              <li key={i}>
                <label className={`option ${ticked[i] ? "is-selected" : ""}`}>
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 shrink-0 accent-[var(--color-accent)]"
                    checked={ticked[i]}
                    onChange={() => setTicked((t) => t.map((v, j) => (j === i ? !v : v)))}
                  />
                  <RichText text={kp} className="text-sm text-[var(--color-text)] leading-relaxed" />
                </label>
              </li>
            ))}
          </ul>
          <button id="concept-grade-done" className="btn btn-primary px-6" onClick={() => finishGrading(phase.answer)}>
            Show model answer
          </button>
        </section>
      )}

      {phase.kind === "done" && (
        <section className="space-y-8 animate-fade-in">
          {phase.skipped ? (
            <ResultBanner tone="incorrect" title="Skipped">This one will come back for review.</ResultBanner>
          ) : (
            <ResultBanner
              tone={phase.covered === total ? "correct" : phase.covered === 0 ? "incorrect" : "partial"}
              title={`You covered ${phase.covered} of ${total} key points.`}
            >
              {phase.covered === total ? "Solid." : "Read the model answer for what you missed."}
            </ResultBanner>
          )}

          {phase.skipped && (
            <Note label="Key points" tone="plain">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[var(--color-text-faint)]">
                {item.key_points.map((kp, i) => (
                  <li key={i}><RichText text={kp} /></li>
                ))}
              </ul>
            </Note>
          )}

          <Note label="Model answer">
            <RichText text={item.model_answer} />
          </Note>

          {item.follow_ups.length > 0 && (
            <Note label="Interviewer follow-ups" tone="warn">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[var(--color-text-faint)]">
                {item.follow_ups.map((f, i) => (
                  <li key={i}><RichText text={f} /></li>
                ))}
              </ul>
            </Note>
          )}
        </section>
      )}
    </div>
  );
}
