// Pure progress logic — no React, no localStorage — so it can be unit-tested.

export type Confidence = "guess" | "somewhat" | "sure";

export interface Attempt {
  itemId: string;
  chosen: string;
  correct: boolean;
  confidence?: Confidence;
  ts: number; // epoch ms
}

export interface ProgressV2 {
  version: 2;
  attempts: Attempt[];
  // Items marked complete under v1, which didn't record right/wrong.
  legacyCompleted: string[];
}

export type ItemStatus = "unseen" | "correct" | "incorrect" | "legacy";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  unseen: "Not attempted",
  correct: "Correct last time",
  incorrect: "Wrong last time",
  legacy: "Completed (result not recorded)",
};

export const V1_KEY = "caselearn_progress_v1";
export const V2_KEY = "caselearn_progress_v2";

export function emptyProgress(): ProgressV2 {
  return { version: 2, attempts: [], legacyCompleted: [] };
}

function isAttempt(a: unknown): a is Attempt {
  if (typeof a !== "object" || a === null) return false;
  const r = a as Record<string, unknown>;
  return (
    typeof r.itemId === "string" &&
    typeof r.chosen === "string" &&
    typeof r.correct === "boolean" &&
    typeof r.ts === "number" &&
    (r.confidence === undefined || ["guess", "somewhat", "sure"].includes(r.confidence as string))
  );
}

/** Parse anything that might be stored progress (v2, v1, or an import file). Returns null if unrecognised. */
export function parseProgress(raw: unknown): ProgressV2 | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.version === 2 && Array.isArray(r.attempts) && Array.isArray(r.legacyCompleted)) {
    return {
      version: 2,
      attempts: r.attempts.filter(isAttempt),
      legacyCompleted: r.legacyCompleted.filter((x): x is string => typeof x === "string"),
    };
  }
  if (Array.isArray(r.completed)) {
    return {
      ...emptyProgress(),
      legacyCompleted: r.completed.filter((x): x is string => typeof x === "string"),
    };
  }
  return null;
}

/** Load from storage strings: prefer v2, else migrate v1, else empty. */
export function loadFromStrings(v2: string | null, v1: string | null): ProgressV2 {
  for (const s of [v2, v1]) {
    if (!s) continue;
    try {
      const p = parseProgress(JSON.parse(s));
      if (p) return p;
    } catch {
      /* fall through */
    }
  }
  return emptyProgress();
}

export function addAttempt(p: ProgressV2, a: Attempt): ProgressV2 {
  return { ...p, attempts: [...p.attempts, a] };
}

/** Union of two progress records; identical attempts (same item + timestamp) are kept once. */
export function mergeProgress(a: ProgressV2, b: ProgressV2): ProgressV2 {
  const byKey = new Map<string, Attempt>();
  for (const at of [...a.attempts, ...b.attempts]) byKey.set(`${at.itemId}@${at.ts}`, at);
  return {
    version: 2,
    attempts: [...byKey.values()].sort((x, y) => x.ts - y.ts),
    legacyCompleted: [...new Set([...a.legacyCompleted, ...b.legacyCompleted])],
  };
}

/** Status per item, from its most recent attempt. */
export function statusMap(p: ProgressV2): Map<string, ItemStatus> {
  const m = new Map<string, ItemStatus>();
  for (const id of p.legacyCompleted) m.set(id, "legacy");
  const lastTs = new Map<string, number>();
  for (const a of p.attempts) {
    if (a.ts >= (lastTs.get(a.itemId) ?? -Infinity)) {
      lastTs.set(a.itemId, a.ts);
      m.set(a.itemId, a.correct ? "correct" : "incorrect");
    }
  }
  return m;
}
