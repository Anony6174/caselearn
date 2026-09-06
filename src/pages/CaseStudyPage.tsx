import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCaseStudies } from "../hooks/useCaseStudies";
import { useProgress } from "../hooks/useProgress";
import { QuestionPanel } from "../components/QuestionPanel";
import { ExplanationPanel } from "../components/ExplanationPanel";

const difficultyLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CaseStudyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { caseStudies, loading, error } = useCaseStudies();
  const { isComplete, markComplete } = useProgress();
  const [submitted, setSubmitted] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-400 py-20">Error: {error}</p>;
  }

  const idx = caseStudies.findIndex((c) => c.id === id);
  const cs = idx >= 0 ? caseStudies[idx] : undefined;

  if (!cs) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--color-text-muted)]">Case study not found.</p>
        <Link to="/" className="btn-primary">← Back to list</Link>
      </div>
    );
  }

  const prevCs = idx > 0 ? caseStudies[idx - 1] : null;
  const nextCs = idx < caseStudies.length - 1 ? caseStudies[idx + 1] : null;
  const alreadyComplete = isComplete(cs.id);

  function handleSubmit(selectedId: string) {
    setSubmitted(selectedId);
    markComplete(cs!.id);
  }

  function goTo(targetId: string) {
    setSubmitted(null);
    navigate(`/case/${targetId}`);
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-[var(--color-border)] sticky top-0 z-20 backdrop-blur-md bg-[rgba(10,10,15,0.85)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-sm"
          >
            <span>←</span> <span>All cases</span>
          </Link>
          <span className="text-[var(--color-border)]">|</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="font-semibold text-sm text-[var(--color-text)]">CaseLearn</span>
          </div>
          {/* Case counter */}
          <span className="ml-auto text-xs text-[var(--color-text-muted)]">
            {idx + 1} / {caseStudies.length}
          </span>
          {alreadyComplete && (
            <span className="text-xs text-[var(--color-beginner)] flex items-center gap-1.5">
              <span className="completed-dot" /> Completed
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Title + meta */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge-${cs.difficulty} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
              {difficultyLabel[cs.difficulty]}
            </span>
            {cs.topics.map((t) => (
              <span key={t} className="topic-chip">{t}</span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {cs.title}
          </h1>
        </div>

        {/* Scenario */}
        <section className="card p-6 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">Scenario</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">{cs.scenario}</p>
        </section>

        {/* Question panel or explanation */}
        {submitted === null ? (
          <QuestionPanel cs={cs} onSubmit={handleSubmit} />
        ) : (
          <ExplanationPanel cs={cs} selectedId={submitted} />
        )}

        {/* Sandbox placeholder (Phase 4) */}
        {submitted !== null && (
          <div className="card p-6 border-dashed text-center space-y-2">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">🧪 Python Sandbox</p>
            <p className="text-xs text-[var(--color-text-muted)] opacity-60">
              Coming in Phase 4 — run the experiment code right in your browser.
            </p>
          </div>
        )}

        {/* Prev / Next navigation */}
        <nav className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
          {prevCs ? (
            <button
              id="nav-prev"
              onClick={() => goTo(prevCs.id)}
              className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors group"
            >
              <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
              <span className="hidden sm:block truncate max-w-[180px]">{prevCs.title}</span>
              <span className="sm:hidden">Previous</span>
            </button>
          ) : (
            <div />
          )}

          <Link
            to="/"
            id="nav-all-cases"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            ☰ All cases
          </Link>

          {nextCs ? (
            <button
              id="nav-next"
              onClick={() => goTo(nextCs.id)}
              className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors group"
            >
              <span className="hidden sm:block truncate max-w-[180px]">{nextCs.title}</span>
              <span className="sm:hidden">Next</span>
              <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          ) : (
            <div />
          )}
        </nav>
      </main>
    </div>
  );
}
