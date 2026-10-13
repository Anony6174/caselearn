import { Link } from "react-router-dom";
import type { Item } from "../../content/schema";
import { itemTypeLabel } from "../../content/labels";
import type { ItemStatus } from "../../progress/progress";
import { StatusDot } from "../StatusDot";

/** One line in a track's syllabus-style list. */
export function ItemRow({ item, status = "unseen" }: { item: Item; status?: ItemStatus }) {
  return (
    <li>
      <Link
        to={`/t/${item.track}/${item.id}`}
        className="group flex items-start gap-3.5 py-3.5 px-1 -mx-1 rounded-lg transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <span className="pt-[0.55rem] pl-1">
          <StatusDot status={status} showUnseen />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[0.95rem] text-[var(--color-text)] leading-snug">{item.title}</span>
          <span className="block mt-0.5 text-xs text-[var(--color-text-faint)] truncate">{item.topics.join(" · ")}</span>
        </span>
        <span className="hidden sm:block pt-0.5 pr-1 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
          {itemTypeLabel(item)}
        </span>
        <span className="pt-0.5 pr-1 text-[var(--color-text-faint)] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}
