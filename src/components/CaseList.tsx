import type { CaseStudy } from "../types/caseStudy";
import { CaseCard } from "./CaseCard";

interface Props {
  caseStudies: CaseStudy[];
  completedIds?: string[];
}

export function CaseList({ caseStudies, completedIds = [] }: Props) {
  if (caseStudies.length === 0) {
    return (
      <p className="text-center text-[var(--color-text-muted)] py-20">
        No case studies found.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {caseStudies.map((cs) => (
        <CaseCard key={cs.id} cs={cs} isComplete={completedIds.includes(cs.id)} />
      ))}
    </div>
  );
}
