import { Link } from "react-router-dom";
import { SECTIONS, TRACK_BLURBS, TRACK_TITLES } from "../content/tracks";
import { useContentIndex } from "../content/useContent";
import { useProgress } from "../hooks/useProgress";
import { AppHeader, ProgressLine, Spinner } from "../components/AppHeader";
import { ProgressBackup } from "../components/ProgressBackup";

const STEPS = [
  { n: "1", title: "Commit", text: "Pick, predict or explain before any feedback." },
  { n: "2", title: "Check", text: "See why each answer is right or wrong." },
  { n: "3", title: "Experiment", text: "Run the code and break it yourself." },
];

export function TracksPage() {
  const { data: index, loading, error } = useContentIndex();
  const { statuses } = useProgress();
  const live = new Set(index?.tracks.map((t) => t.id));

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 max-w-2xl">
          <h1 className="serif text-5xl sm:text-6xl leading-[1.05] text-[var(--color-text)]">
            Think <em className="text-[var(--color-accent)]">before</em> you pick.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
            Interview prep for understanding rather than recall. Commit to an answer, then check your reasoning
            against the real thing.
          </p>
          <ol className="mt-8 grid sm:grid-cols-3 gap-4 sm:gap-6">
            {STEPS.map((s) => (
              <li key={s.n} className="text-sm">
                <p className="text-[var(--color-text)] font-medium">
                  <span className="text-[var(--color-text-faint)] tabular-nums mr-1.5">{s.n}</span>
                  {s.title}
                </p>
                <p className="text-[var(--color-text-muted)] mt-0.5 leading-snug">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {loading && <Spinner />}
        {error && <p className="text-center text-[var(--color-bad)] py-20">Failed to load content: {error}</p>}

        {index && (
          <>
            <div className="space-y-16">
              {SECTIONS.map((section) => {
                const tracks = section.tracks.flatMap((id) => index.tracks.filter((t) => t.id === id));
                const soon = section.tracks.filter((id) => !live.has(id));
                if (tracks.length === 0) return null;
                return (
                  <section key={section.title} aria-labelledby={`section-${section.title}`}>
                    <div className="mb-5">
                      <h2 id={`section-${section.title}`} className="serif text-[2rem] leading-tight text-[var(--color-text)]">
                        {section.title}
                      </h2>
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{section.blurb}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tracks.map((t) => {
                        const attempted = t.item_ids.filter((id) => statuses.has(id)).length;
                        const correct = t.item_ids.filter((id) => statuses.get(id) === "correct").length;
                        return (
                          <Link key={t.id} to={`/t/${t.id}`} id={`track-${t.id}`} className="card card-link flex flex-col p-6">
                            <div className="flex items-baseline justify-between gap-3">
                              <h3 className="serif text-[1.6rem] leading-tight text-[var(--color-text)]">{t.title}</h3>
                              <span className="text-xs text-[var(--color-text-faint)] tabular-nums shrink-0">{t.count} items</span>
                            </div>
                            <p className="mt-1.5 mb-6 flex-1 text-sm text-[var(--color-text-muted)] leading-relaxed">{TRACK_BLURBS[t.id]}</p>
                            <ProgressLine attempted={attempted} correct={correct} total={t.count} />
                          </Link>
                        );
                      })}
                    </div>
                    {soon.length > 0 && (
                      <p className="mt-5 text-sm text-[var(--color-text-faint)] leading-relaxed">
                        <span className="text-[var(--color-text-muted)]">Coming next</span>
                        {" · "}
                        {soon.map((t) => TRACK_TITLES[t]).join(" · ")}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>

            <footer className="mt-20 mb-10 pt-6 border-t border-[var(--color-border)]">
              <ProgressBackup />
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
