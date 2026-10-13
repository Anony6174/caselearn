import { STATUS_LABEL, type ItemStatus } from "../progress/progress";

const colors: Record<Exclude<ItemStatus, "unseen">, string> = {
  correct: "var(--color-beginner)",
  incorrect: "var(--color-advanced)",
  legacy: "var(--color-text-muted)",
};

export function StatusDot({ status }: { status: ItemStatus }) {
  if (status === "unseen") return null;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: colors[status] }}
      title={STATUS_LABEL[status]}
    />
  );
}
