import { useState } from "react";
import type { Difficulty } from "../content/schema";

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

const LEVELS: Array<{ value: Difficulty | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

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
  const [topicsOpen, setTopicsOpen] = useState(false);
  const hasFilters = selectedTopics.length > 0 || selectedDifficulty !== "all";

  return (
    <div className="mb-10 space-y-4">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-[var(--color-border)]">
        {LEVELS.map(({ value, label }) => {
          const active = selectedDifficulty === value;
          return (
            <button
              key={value}
              id={`filter-difficulty-${value}`}
              onClick={() => onDifficultyChange(value)}
              aria-pressed={active}
              className={`-mb-px px-3 py-2 text-sm border-b-2 transition-colors ${
                active
                  ? "border-[var(--color-text)] text-[var(--color-text)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          id="filter-topics-toggle"
          onClick={() => setTopicsOpen((o) => !o)}
          aria-expanded={topicsOpen}
          className="ml-auto -mb-px px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Topics{selectedTopics.length > 0 ? ` (${selectedTopics.length})` : ""} {topicsOpen ? "▴" : "▾"}
        </button>
      </div>

      {topicsOpen && (
        <div className="flex flex-wrap gap-1.5 animate-fade-in">
          {allTopics.map((topic) => {
            const active = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                id={`filter-topic-${topic}`}
                onClick={() => onTopicToggle(topic)}
                aria-pressed={active}
                className={`chip transition-colors ${
                  active
                    ? "!bg-[var(--color-text)] !text-[var(--color-bg)]"
                    : "hover:!text-[var(--color-text)]"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>
      )}

      {hasFilters && (
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <p>
            Showing <span className="text-[var(--color-text)] tabular-nums">{activeCount}</span> of{" "}
            <span className="tabular-nums">{totalCount}</span>
          </p>
          <button id="filter-clear-btn" onClick={onClear} className="link">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
