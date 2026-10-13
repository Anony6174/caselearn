import { useCaseStudies } from "../hooks/useCaseStudies";
import { useProgress } from "../hooks/useProgress";
import { useFilters } from "../hooks/useFilters";
import { CaseList } from "../components/CaseList";
import { ProgressBadge } from "../components/ProgressBadge";
import { FilterBar } from "../components/FilterBar";
import { ProgressBackup } from "../components/ProgressBackup";

export function HomePage() {
  const { caseStudies, loading, error } = useCaseStudies();
  const { statuses } = useProgress();
  const {
    allTopics,
    selectedTopics,
    selectedDifficulty,
    toggleTopic,
    setSelectedDifficulty,
    clearFilters,
    filtered,
  } = useFilters(caseStudies);

  const attempted = caseStudies.filter((c) => statuses.has(c.id));
  const correctCount = attempted.filter((c) => statuses.get(c.id) === "correct").length;
  const byDifficulty = {
    beginner: attempted.filter((c) => c.difficulty === "beginner").length,
    intermediate: attempted.filter((c) => c.difficulty === "intermediate").length,
    advanced: attempted.filter((c) => c.difficulty === "advanced").length,
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-[var(--color-border)] sticky top-0 z-20 backdrop-blur-md bg-[rgba(10,10,15,0.85)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold">C</div>
          <span className="font-semibold tracking-tight text-[var(--color-text)]">CaseLearn</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <section className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[rgba(124,106,247,0.1)] border border-[rgba(124,106,247,0.25)] text-[#a99ff5] text-xs font-medium px-3 py-1 rounded-full mb-5">
            ✦ ML &amp; Statistics · Application Reasoning
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white via-[#c8c5f8] to-[var(--color-accent)] bg-clip-text text-transparent leading-tight">
            Think before you pick.
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
            Realistic scenarios. No recall required. Commit to an answer, then verify your reasoning by running the numbers yourself.
          </p>
        </section>

        {/* Progress + stats row */}
        {!loading && !error && (
          <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
            <ProgressBadge
              completed={attempted.length}
              correct={correctCount}
              total={caseStudies.length}
              byDifficulty={byDifficulty}
            />
            <div className="flex gap-6">
              {[
                { label: "Total", value: caseStudies.length, color: "var(--color-accent)" },
                { label: "Beginner", value: caseStudies.filter(c => c.difficulty === "beginner").length, color: "var(--color-beginner)" },
                { label: "Intermediate", value: caseStudies.filter(c => c.difficulty === "intermediate").length, color: "var(--color-intermediate)" },
                { label: "Advanced", value: caseStudies.filter(c => c.difficulty === "advanced").length, color: "var(--color-advanced)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading / error */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-center text-red-400 py-20">Failed to load case studies: {error}</p>
        )}

        {/* Filters + grid */}
        {!loading && !error && (
          <>
            <FilterBar
              allTopics={allTopics}
              selectedTopics={selectedTopics}
              selectedDifficulty={selectedDifficulty}
              onTopicToggle={toggleTopic}
              onDifficultyChange={setSelectedDifficulty}
              onClear={clearFilters}
              activeCount={filtered.length}
              totalCount={caseStudies.length}
            />
            <CaseList caseStudies={filtered} statuses={statuses} />
            <ProgressBackup />
          </>
        )}
      </main>
    </div>
  );
}
