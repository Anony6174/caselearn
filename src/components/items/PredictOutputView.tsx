import { useMemo, useState } from "react";
import type { PredictOutputItem } from "../../content/schema";
import { normalizeOutput, predictOptions } from "../../content/output";
import type { RecordAttempt } from "./types";
import { CodeEditor } from "../Sandbox/CodeEditor";
import { SandboxPanel } from "../Sandbox/SandboxPanel";
import { LockInButton, QuestionPanel } from "../QuestionPanel";
import { RichText } from "../RichText";
import { Note, ResultBanner } from "./ResultBanner";
import { Split } from "./Split";

const LANGUAGE_LABEL = { python: "Python", cpp: "C++20" };

type Phase =
  | { kind: "answering" }
  | { kind: "disputed"; prediction: string } // typed answer differs from the real output; user decides
  | { kind: "revealed"; prediction: string; correct: boolean };

export function PredictOutputView({ item, onAttempt }: { item: PredictOutputItem; onAttempt: RecordAttempt }) {
  const expected = item.expected_output ?? "";
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [typed, setTyped] = useState("");
  const options = useMemo(
    () => (item.distractors ? predictOptions(item.id, expected, item.distractors) : null),
    [item.id, item.distractors, expected],
  );
  const question = item.prompt ?? "What does this print?";

  function reveal(prediction: string, correct: boolean) {
    setPhase({ kind: "revealed", prediction, correct });
    onAttempt({ itemId: item.id, chosen: prediction, correct });
  }

  function submitTyped() {
    if (normalizeOutput(typed) === normalizeOutput(expected)) reveal(typed, true);
    else setPhase({ kind: "disputed", prediction: typed });
  }

  function submitOption(id: string) {
    const opt = options!.find((o) => o.id === id)!;
    reveal(opt.text, opt.correct);
  }

  const main = (
    <div className="space-y-10">
      {phase.kind === "answering" &&
        (options ? (
          <QuestionPanel question={question} options={options} mono onSubmit={submitOption} />
        ) : (
          <section className="space-y-3">
            <h2 className="text-[1.05rem] font-medium text-[var(--color-text)]">{question}</h2>
            <textarea
              id="prediction-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={Math.min(10, Math.max(3, typed.split("\n").length + 1))}
              spellCheck={false}
              className="input font-mono text-sm"
              placeholder="Type the exact output…"
            />
            <LockInButton disabled={typed.trim() === ""} hint="Write your prediction first" onClick={submitTyped} />
          </section>
        ))}

      {phase.kind === "disputed" && (
        <section className="space-y-5 animate-fade-in">
          <OutputCompare prediction={phase.prediction} actual={expected} />
          <div className="card p-5 space-y-4">
            <p className="text-sm text-[var(--color-text)]">
              These don't match exactly. Did your prediction mean the same thing, with only formatting different?
            </p>
            <div className="flex flex-wrap gap-2">
              <button id="dispute-wrong" className="btn btn-primary" onClick={() => reveal(phase.prediction, false)}>
                No, I got it wrong
              </button>
              <button id="dispute-formatting" className="btn btn-secondary" onClick={() => reveal(phase.prediction, true)}>
                Yes, only formatting differs
              </button>
            </div>
          </div>
        </section>
      )}

      {phase.kind === "revealed" && (
        <section className="space-y-8 animate-fade-in">
          <ResultBanner tone={phase.correct ? "correct" : "incorrect"} title={phase.correct ? "Correct" : "Not quite"} />
          <OutputCompare prediction={phase.prediction} actual={expected} />
          <Note label="Why">
            <RichText text={item.explanation} />
          </Note>
          {item.try_this && item.language === "cpp" && (
            <Note label="Try this" tone="warn">
              <RichText text={item.try_this} />
              <p className="mt-2 text-xs text-[var(--color-text-faint)]">
                Paste the code into godbolt.org to run it. An in-app C++ runner is coming in Phase 3.
              </p>
            </Note>
          )}
        </section>
      )}
    </div>
  );

  // After answering, a Python snippet becomes runnable in place.
  const side =
    phase.kind === "revealed" && item.language === "python" ? (
      <div className="animate-fade-in">
        <SandboxPanel
          caseId={item.id}
          experimentation={{
            objective: "Run it to confirm, then change something and predict again before you re-run.",
            data_generation_code: item.code,
            suggested_exploration: item.try_this ?? "Change one line, write down what you expect, then run it.",
          }}
        />
      </div>
    ) : (
      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="eyebrow">{LANGUAGE_LABEL[item.language]}</h2>
          {phase.kind === "answering" && (
            <span className="text-xs text-[var(--color-text-faint)]">Trace it in your head. Don't run it yet.</span>
          )}
        </div>
        <CodeEditor code={item.code} language={item.language} readOnly />
      </section>
    );

  return <Split main={main} side={side} sideFirstOnMobile />;
}

function OutputCompare({ prediction, actual }: { prediction: string; actual: string }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[
        { label: "Your prediction", text: prediction },
        { label: "Actual output", text: actual },
      ].map(({ label, text }) => (
        <div key={label} className="min-w-0">
          <p className="eyebrow mb-1.5">{label}</p>
          <pre className="code-surface p-3.5 overflow-x-auto text-[var(--color-text)]">{normalizeOutput(text) || " "}</pre>
        </div>
      ))}
    </div>
  );
}
