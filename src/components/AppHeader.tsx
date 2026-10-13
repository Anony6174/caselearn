import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  back?: { to: string; label: string };
  children?: ReactNode; // right-aligned extras
}

export function AppHeader({ back, children }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="serif text-[1.35rem] leading-none text-[var(--color-text)] shrink-0">
          caselearn
        </Link>
        {back && (
          <>
            <span className="text-[var(--color-border-strong)]" aria-hidden="true">/</span>
            <Link to={back.to} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors truncate">
              {back.label}
            </Link>
          </>
        )}
        <div className="ml-auto flex items-center gap-3 sm:gap-4 text-xs text-[var(--color-text-muted)]">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="Loading">
      <div className="spinner" />
    </div>
  );
}

/** Thin progress line with "x / n attempted · y correct". */
export function ProgressLine({ attempted, correct, total }: { attempted: number; correct: number; total: number }) {
  const pct = total > 0 ? (attempted / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
        {attempted} of {total} attempted
        {attempted > 0 && (
          <>
            {" · "}
            <span className="text-[var(--color-good)]">{correct} correct</span>
          </>
        )}
      </p>
    </div>
  );
}
