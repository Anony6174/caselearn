import type { Difficulty, Item } from "./schema";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const LANGUAGE_NAME = { python: "Python", cpp: "C++", bash: "Bash" } as const;

export function itemTypeLabel(item: Item): string {
  switch (item.type) {
    case "case-mcq":
      return "Case study";
    case "predict-output":
      return `Predict output · ${LANGUAGE_NAME[item.language]}`;
    case "concept":
      return "Explain why";
    case "code-challenge":
      return `Code challenge · ${LANGUAGE_NAME[item.language]}`;
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
    case "code-challenge":
      return item.statement;
  }
}

/** Items laid out with a code panel beside the question. */
export function hasCodePanel(item: Item): boolean {
  return (
    item.type === "predict-output" ||
    item.type === "code-challenge" ||
    (item.type === "case-mcq" && item.experimentation !== undefined)
  );
}
