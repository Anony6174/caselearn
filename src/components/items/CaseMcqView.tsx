import { useState } from "react";
import type { CaseMcqItem } from "../../content/schema";
import type { RecordAttempt } from "./types";
import { QuestionPanel } from "../QuestionPanel";
import { ExplanationPanel } from "../ExplanationPanel";
import { SandboxLocked, SandboxPanel } from "../Sandbox/SandboxPanel";
import { RichText } from "../RichText";
import { Split } from "./Split";

export function CaseMcqView({ item, onAttempt }: { item: CaseMcqItem; onAttempt: RecordAttempt }) {
  const [submitted, setSubmitted] = useState<string | null>(null);

  function handleSubmit(choice: string) {
    setSubmitted(choice);
    onAttempt({ itemId: item.id, chosen: choice, correct: choice === item.correct_option_id });
  }

  const main = (
    <div className="space-y-10">
      <section className="card p-6 sm:p-7">
        <h2 className="eyebrow mb-2">Scenario</h2>
        <RichText text={item.scenario} className="text-[0.98rem] text-[var(--color-text)] leading-relaxed" />
      </section>

      {submitted === null ? (
        <QuestionPanel question={item.question} options={item.options} onSubmit={handleSubmit} />
      ) : (
        <ExplanationPanel cs={item} selectedId={submitted} />
      )}
    </div>
  );

  // The sandbox unlocks only after committing to an answer.
  const side = item.experimentation ? (
    submitted === null ? (
      <SandboxLocked />
    ) : (
      <div className="animate-fade-in">
        <SandboxPanel experimentation={item.experimentation} caseId={item.id} />
      </div>
    )
  ) : undefined;

  return <Split main={main} side={side} />;
}
