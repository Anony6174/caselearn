import type { Difficulty } from "../content/schema";
import { DIFFICULTY_LABEL } from "../content/labels";
import { STATUS_LABEL, type ItemStatus } from "../progress/progress";

const statusColor: Record<Exclude<ItemStatus, "unseen">, string> = {
  correct: "var(--color-good)",
  incorrect: "var(--color-bad)",
  legacy: "var(--color-text-faint)",
};

/** Filled dot for an attempted item; a hollow ring for unseen ones when `showUnseen`. */
export function StatusDot({ status, showUnseen = false }: { status: ItemStatus; showUnseen?: boolean }) {
  if (status === "unseen") {
    return showUnseen ? (
      <span className="inline-block w-2 h-2 rounded-full shrink-0 border border-[var(--color-border-strong)]" title={STATUS_LABEL.unseen} />
    ) : null;
  }
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: statusColor[status] }}
      title={STATUS_LABEL[status]}
    />
  );
}

const difficultyColor: Record<Difficulty, string> = {
  beginner: "var(--color-good)",
  intermediate: "var(--color-warn)",
  advanced: "var(--color-bad)",
};

export function DifficultyTag({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: difficultyColor[difficulty] }} aria-hidden="true" />
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}
