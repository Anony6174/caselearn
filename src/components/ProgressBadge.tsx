interface Props {
  completed: number;
  correct: number;
  total: number;
  byDifficulty?: { beginner: number; intermediate: number; advanced: number };
}

export function ProgressBadge({ completed, correct, total, byDifficulty }: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="inline-flex flex-col items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-6 py-4 min-w-[200px]">
      <div className="text-center">
        <span className="text-3xl font-extrabold text-[var(--color-accent)]">{completed}</span>
        <span className="text-xl font-semibold text-[var(--color-text-muted)]"> / {total}</span>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          attempted · <span className="text-[var(--color-beginner)]">{correct} correct</span> last try
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-accent), #a99ff5)",
          }}
        />
      </div>

      {/* Per-difficulty mini stats */}
      {byDifficulty && (
        <div className="flex gap-4 text-xs">
          <span className="text-[var(--color-beginner)] font-medium">{byDifficulty.beginner}B</span>
          <span className="text-[var(--color-intermediate)] font-medium">{byDifficulty.intermediate}I</span>
          <span className="text-[var(--color-advanced)] font-medium">{byDifficulty.advanced}A</span>
        </div>
      )}
    </div>
  );
}
