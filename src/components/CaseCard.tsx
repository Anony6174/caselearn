import { Link } from "react-router-dom";
import type { CaseStudy } from "../types/caseStudy";

interface Props {
  cs: CaseStudy;
  isComplete?: boolean;
}

const difficultyLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CaseCard({ cs, isComplete = false }: Props) {
  return (
    <Link
      to={`/case/${cs.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-[1rem]"
    >
      <article className="card p-5 h-full flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold leading-snug text-[var(--color-text)]">
            {cs.title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {isComplete && <span className="completed-dot" title="Completed" />}
            <span className={`badge-${cs.difficulty} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
              {difficultyLabel[cs.difficulty]}
            </span>
          </div>
        </div>

        {/* Scenario snippet */}
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-3 flex-1">
          {cs.scenario}
        </p>

        {/* Topic chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {cs.topics.map((t) => (
            <span key={t} className="topic-chip">{t}</span>
          ))}
        </div>
      </article>
    </Link>
  );
}
