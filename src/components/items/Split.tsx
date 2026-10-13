import type { ReactNode } from "react";

interface Props {
  main: ReactNode;
  /** The code panel. Without one, the main column is centred on its own. */
  side?: ReactNode;
  /** On narrow screens the columns stack; put the side panel first (e.g. code you must read before answering). */
  sideFirstOnMobile?: boolean;
}

/** Question on the left, code on the right (sticky while you scroll the explanation). */
export function Split({ main, side, sideFirstOnMobile = false }: Props) {
  if (!side) return <div className="max-w-2xl mx-auto">{main}</div>;
  return (
    <div className="grid gap-10 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] items-start">
      <div className="min-w-0">{main}</div>
      <aside
        className={`min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-2 ${
          sideFirstOnMobile ? "order-first lg:order-none" : ""
        }`}
      >
        {side}
      </aside>
    </div>
  );
}
