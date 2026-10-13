/**
 * Canonical form for comparing program output: line endings unified, trailing
 * whitespace on each line dropped, leading/trailing blank lines dropped.
 * Used by both the build (distractor checks) and the app (grading a prediction).
 */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

/**
 * Multiple-choice options for a predict-output item: the real output plus the
 * distractors, in an order that is shuffled but stable for a given item id
 * (so the answer isn't always "a", and doesn't move between visits).
 */
export function predictOptions(itemId: string, expected: string, distractors: string[]) {
  let seed = 0;
  for (const ch of itemId) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
  const texts = [expected, ...distractors];
  for (let i = texts.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const j = seed % (i + 1);
    [texts[i], texts[j]] = [texts[j], texts[i]];
  }
  return texts.map((text, i) => ({
    id: String.fromCharCode(97 + i),
    text: normalizeOutput(text),
    correct: text === expected,
  }));
}
