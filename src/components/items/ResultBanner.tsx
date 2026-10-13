import type { ReactNode } from "react";

interface Props {
  tone: "correct" | "incorrect" | "partial";
  title: string;
  children?: ReactNode;
}

const tones = {
  correct: { color: "var(--color-good)", bg: "var(--color-good-soft)", icon: "✓" },
  incorrect: { color: "var(--color-bad)", bg: "var(--color-bad-soft)", icon: "✕" },
  partial: { color: "var(--color-warn)", bg: "var(--color-warn-soft)", icon: "◐" },
};

export function ResultBanner({ tone, title, children }: Props) {
  const t = tones[tone];
  return (
    <div className="rounded-xl px-4 py-3.5 flex items-start gap-3" style={{ background: t.bg }} role="status">
      <span
        className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ background: t.color, color: "var(--color-bg)" }}
        aria-hidden="true"
      >
        {t.icon}
      </span>
      <div className="pt-0.5">
        <p className="text-sm font-medium" style={{ color: t.color }}>{title}</p>
        {children && <div className="text-sm text-[var(--color-text-muted)] mt-0.5">{children}</div>}
      </div>
    </div>
  );
}

/** Eyebrow-labelled block of text with an optional coloured rule. */
export function Note({ label, tone = "accent", children }: { label: string; tone?: "accent" | "warn" | "plain"; children: ReactNode }) {
  return (
    <section className={`note ${tone === "accent" ? "note-accent" : tone === "warn" ? "note-warn" : ""}`}>
      <h3 className="eyebrow mb-1.5">{label}</h3>
      <div className="text-[0.95rem] text-[var(--color-text)] leading-relaxed">{children}</div>
    </section>
  );
}
