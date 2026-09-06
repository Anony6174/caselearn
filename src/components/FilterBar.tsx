import type { Difficulty } from "../types/caseStudy";

interface Props {
  allTopics: string[];
  selectedTopics: string[];
  selectedDifficulty: Difficulty | "all";
  onTopicToggle: (topic: string) => void;
  onDifficultyChange: (d: Difficulty | "all") => void;
  onClear: () => void;
  activeCount: number;
  totalCount: number;
}

const DIFFICULTIES: Array<{ value: Difficulty | "all"; label: string }> = [
  { value: "all", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const difficultyColor: Record<string, string> = {
  beginner: "var(--color-beginner)",
  intermediate: "var(--color-intermediate)",
  advanced: "var(--color-advanced)",
  all: "var(--color-accent)",
};

export function FilterBar({
  allTopics,
  selectedTopics,
  selectedDifficulty,
  onTopicToggle,
  onDifficultyChange,
  onClear,
  activeCount,
  totalCount,
}: Props) {
  const hasFilters = selectedTopics.length > 0 || selectedDifficulty !== "all";

  return (
    <div className="space-y-4 mb-8">
      {/* Difficulty pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mr-1">
          Level
        </span>
        {DIFFICULTIES.map(({ value, label }) => {
          const active = selectedDifficulty === value;
          const color = difficultyColor[value];
          return (
            <button
              key={value}
              id={`filter-difficulty-${value}`}
              onClick={() => onDifficultyChange(value)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150"
              style={{
                borderColor: active ? color : "var(--color-border)",
                background: active ? `color-mix(in srgb, ${color} 14%, transparent)` : "transparent",
                color: active ? color : "var(--color-text-muted)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Topic chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mr-1">
          Topic
        </span>
        {allTopics.map((topic) => {
          const active = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              id={`filter-topic-${topic}`}
              onClick={() => onTopicToggle(topic)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150"
              style={{
                borderColor: active ? "var(--color-accent)" : "var(--color-border)",
                background: active ? "rgba(124,106,247,0.14)" : "transparent",
                color: active ? "#a99ff5" : "var(--color-text-muted)",
              }}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Results summary + clear */}
      {hasFilters && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-[var(--color-text-muted)]">
            Showing <span className="text-[var(--color-text)] font-semibold">{activeCount}</span> of{" "}
            <span className="text-[var(--color-text)] font-semibold">{totalCount}</span> case studies
          </p>
          <button
            id="filter-clear-btn"
            onClick={onClear}
            className="text-xs text-[var(--color-accent)] hover:opacity-75 transition-opacity font-medium"
          >
            Clear filters ✕
          </button>
        </div>
      )}
    </div>
  );
}
