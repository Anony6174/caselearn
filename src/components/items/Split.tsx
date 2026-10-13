import type { ReactNode } from "react";
import { useCodePanel } from "./codePanel";

interface Props {
  main: ReactNode;
  /** The code panel. Without one, the main column is centred on its own. */
  side?: ReactNode;
  /** On narrow screens the columns stack; put the side panel first (e.g. code you must read before answering). */
  sideFirstOnMobile?: boolean;
}

/** Question on the left, code on the right (sticky while you scroll the explanation). */
export function Split({ main, side, sideFirstOnMobile = false }: Props) {
  const { expanded, toggle } = useCodePanel();
  if (!side) return <div className="max-w-2xl mx-auto">{main}</div>;
  return (
    <div
      className={`grid gap-10 lg:gap-12 items-start ${
        expanded
          ? "lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.5fr)]"
          : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]"
      }`}
    >
      <div className="min-w-0">{main}</div>
      <aside
        className={`min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-2 ${
          sideFirstOnMobile ? "order-first lg:order-none" : ""
        }`}
      >
        <div className="hidden lg:flex justify-end -mt-1 mb-1">
          <button
            id="code-panel-toggle"
            onClick={toggle}
            aria-pressed={expanded}
            className="btn btn-ghost !py-1 !px-1.5 text-xs gap-1.5"
            title={expanded ? "Give the question more room again" : "Make the code panel wider and taller"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {expanded ? (
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
              ) : (
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              )}
            </svg>
            {expanded ? "Shrink code" : "Expand code"}
          </button>
        </div>
        {side}
      </aside>
    </div>
  );
}
