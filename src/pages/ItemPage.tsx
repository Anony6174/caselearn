import { Link, Navigate, useParams } from "react-router-dom";
import type { Item } from "../content/schema";
import { asTrack, TRACK_TITLES } from "../content/tracks";
import { hasCodePanel, itemTypeLabel } from "../content/labels";
import { useTrack } from "../content/useContent";
import { useProgress } from "../hooks/useProgress";
import { AppHeader, Spinner } from "../components/AppHeader";
import { DifficultyTag, StatusDot } from "../components/StatusDot";
import { STATUS_LABEL } from "../progress/progress";
import type { RecordAttempt } from "../components/items/types";
import { CaseMcqView } from "../components/items/CaseMcqView";
import { PredictOutputView } from "../components/items/PredictOutputView";
import { ConceptView } from "../components/items/ConceptView";

function ItemView({ item, onAttempt }: { item: Item; onAttempt: RecordAttempt }) {
  switch (item.type) {
    case "case-mcq":
      return <CaseMcqView item={item} onAttempt={onAttempt} />;
    case "predict-output":
      return <PredictOutputView item={item} onAttempt={onAttempt} />;
    case "concept":
      return <ConceptView item={item} onAttempt={onAttempt} />;
  }
}

export function ItemPage() {
  const params = useParams<{ track: string; id: string }>();
  const track = asTrack(params.track);
  const { data, loading, error } = useTrack(track);
  const { statusOf, recordAttempt } = useProgress();

  if (!track) return <Navigate to="/" replace />;
  const back = { to: `/t/${track}`, label: TRACK_TITLES[track] };

  if (loading || error) {
    return (
      <div className="min-h-screen">
        <AppHeader back={back} />
        {loading ? <Spinner /> : <p className="text-center text-[var(--color-bad)] py-20">Error: {error}</p>}
      </div>
    );
  }

  const items = data?.items ?? [];
  const idx = items.findIndex((i) => i.id === params.id);
  const item = items[idx];

  if (!item) {
    return (
      <div className="min-h-screen">
        <AppHeader back={back} />
        <div className="flex flex-col items-center gap-4 py-24">
          <p className="text-[var(--color-text-muted)]">Item not found.</p>
          <Link to={back.to} className="btn btn-secondary">← Back to {back.label}</Link>
        </div>
      </div>
    );
  }

  const prev = items[idx - 1];
  const next = items[idx + 1];
  const status = statusOf(item.id);
  const column = hasCodePanel(item) ? "max-w-6xl" : "max-w-2xl";

  return (
    <div className="min-h-screen">
      <AppHeader back={back}>
        {status !== "unseen" && (
          <span className="hidden sm:flex items-center gap-1.5">
            <StatusDot status={status} /> {STATUS_LABEL[status]}
          </span>
        )}
        <span className="tabular-nums">
          {idx + 1} / {items.length}
        </span>
      </AppHeader>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className={`${column} mx-auto pt-10 sm:pt-14 mb-8`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
            <span className="eyebrow !text-[var(--color-accent)]">{itemTypeLabel(item)}</span>
            <DifficultyTag difficulty={item.difficulty} />
            {!item.verified && (
              <span
                className="text-[var(--color-text-faint)] italic"
                title="The answer key hasn't been reviewed by hand yet. If something looks wrong, check it."
              >
                unreviewed
              </span>
            )}
          </div>
          <h1 className="serif mt-3 text-4xl sm:text-[2.75rem] leading-[1.1] text-[var(--color-text)]">{item.title}</h1>
          <p className="mt-3 text-xs text-[var(--color-text-faint)]">{item.topics.join(" · ")}</p>
        </div>

        {/* key: a fresh view (and fresh answer state) for each item */}
        <ItemView key={item.id} item={item} onAttempt={recordAttempt} />

        <nav className={`${column} mx-auto mt-16 pt-6 border-t border-[var(--color-border)] grid grid-cols-2 gap-4`}>
          {prev ? (
            <Link id="nav-prev" to={`/t/${track}/${prev.id}`} className="group min-w-0">
              <span className="eyebrow">← Previous</span>
              <span className="block mt-1 text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors truncate">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link id="nav-next" to={`/t/${track}/${next.id}`} className="group min-w-0 text-right">
              <span className="eyebrow">Next →</span>
              <span className="block mt-1 text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors truncate">
                {next.title}
              </span>
            </Link>
          ) : (
            <Link id="nav-all" to={back.to} className="group min-w-0 text-right">
              <span className="eyebrow">Done</span>
              <span className="block mt-1 text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
                Back to {back.label}
              </span>
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
