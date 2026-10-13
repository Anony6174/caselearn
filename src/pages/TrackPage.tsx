import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { TRACK_BLURBS, TRACK_TITLES, asTrack } from "../content/tracks";
import { DIFFICULTY_LABEL } from "../content/labels";
import type { Difficulty } from "../content/schema";
import { useTrack } from "../content/useContent";
import { useProgress } from "../hooks/useProgress";
import { useFilters } from "../hooks/useFilters";
import { AppHeader, ProgressLine, Spinner } from "../components/AppHeader";
import { FilterBar } from "../components/FilterBar";
import { DifficultyTag } from "../components/StatusDot";
import { ItemRow } from "../components/items/ItemRow";

const LEVELS: Difficulty[] = ["beginner", "intermediate", "advanced"];

export function TrackPage() {
  const track = asTrack(useParams<{ track: string }>().track);
  const { data, loading, error } = useTrack(track);
  const { statuses } = useProgress();
  const items = useMemo(() => data?.items ?? [], [data]);
  const filters = useFilters(items);

  if (!track) return <Navigate to="/" replace />;

  const attempted = items.filter((i) => statuses.has(i.id));
  const correct = attempted.filter((i) => statuses.get(i.id) === "correct").length;

  return (
    <div className="min-h-screen">
      <AppHeader back={{ to: "/", label: "Tracks" }} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <section className="pt-12 sm:pt-16 pb-10">
          <h1 className="serif text-5xl leading-tight text-[var(--color-text)]">{TRACK_TITLES[track]}</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">{TRACK_BLURBS[track]}</p>
          {data && (
            <div className="mt-6 max-w-xs">
              <ProgressLine attempted={attempted.length} correct={correct} total={items.length} />
            </div>
          )}
        </section>

        {loading && <Spinner />}
        {error && <p className="text-center text-[var(--color-bad)] py-20">Failed to load this track: {error}</p>}

        {data && (
          <>
            <FilterBar
              allTopics={filters.allTopics}
              selectedTopics={filters.selectedTopics}
              selectedDifficulty={filters.selectedDifficulty}
              onTopicToggle={filters.toggleTopic}
              onDifficultyChange={filters.setSelectedDifficulty}
              onClear={filters.clearFilters}
              activeCount={filters.filtered.length}
              totalCount={items.length}
            />
            {filters.filtered.length === 0 ? (
              <p className="text-center text-[var(--color-text-muted)] py-16">No items match these filters.</p>
            ) : (
              <div className="space-y-10">
                {LEVELS.map((level) => {
                  const group = filters.filtered.filter((i) => i.difficulty === level);
                  if (group.length === 0) return null;
                  return (
                    <section key={level} aria-label={DIFFICULTY_LABEL[level]}>
                      <div className="flex items-center justify-between mb-1">
                        <DifficultyTag difficulty={level} />
                        <span className="text-xs text-[var(--color-text-faint)] tabular-nums">{group.length}</span>
                      </div>
                      <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                        {group.map((item) => (
                          <ItemRow key={item.id} item={item} status={statuses.get(item.id)} />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
