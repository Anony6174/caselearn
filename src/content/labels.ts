import type { Difficulty, Item } from "./schema";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function itemTypeLabel(item: Item): string {
  switch (item.type) {
    case "case-mcq":
      return "Case study";
    case "predict-output":
      return `Predict output · ${item.language === "cpp" ? "C++" : "Python"}`;
    case "concept":
      return "Explain why";
  }
}

export function itemSummary(item: Item): string {
  switch (item.type) {
    case "case-mcq":
      return item.scenario;
    case "predict-output":
      return item.prompt ?? "What does this print?";
    case "concept":
      return item.prompt;
  }
}

/** Items laid out with a code panel beside the question. */
export function hasCodePanel(item: Item): boolean {
  return item.type === "predict-output" || (item.type === "case-mcq" && item.experimentation !== undefined);
}
