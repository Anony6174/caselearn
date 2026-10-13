import { describe, expect, it } from "vitest";
import {
  addAttempt, emptyProgress, loadFromStrings, mergeProgress, parseProgress, statusMap,
  type Attempt,
} from "./progress";

const at = (itemId: string, correct: boolean, ts: number): Attempt => ({ itemId, chosen: "a", correct, ts });

describe("loadFromStrings", () => {
  it("migrates v1 completed ids into legacyCompleted", () => {
    const p = loadFromStrings(null, JSON.stringify({ completed: ["cs-01", "cs-02"] }));
    expect(p).toEqual({ version: 2, attempts: [], legacyCompleted: ["cs-01", "cs-02"] });
  });

  it("prefers v2 over v1", () => {
    const v2 = JSON.stringify(addAttempt(emptyProgress(), at("cs-03", true, 1)));
    const p = loadFromStrings(v2, JSON.stringify({ completed: ["cs-01"] }));
    expect(p.attempts).toHaveLength(1);
    expect(p.legacyCompleted).toEqual([]);
  });

  it("falls back to empty on corrupt data", () => {
    expect(loadFromStrings("{not json", "null")).toEqual(emptyProgress());
  });
});

describe("parseProgress", () => {
  it("drops malformed attempts but keeps valid ones", () => {
    const p = parseProgress({
      version: 2,
      legacyCompleted: [],
      attempts: [at("cs-01", true, 1), { itemId: "cs-02" }, { ...at("cs-03", false, 2), confidence: "maybe" }],
    });
    expect(p?.attempts.map((a) => a.itemId)).toEqual(["cs-01"]);
  });

  it("rejects unrelated JSON", () => {
    expect(parseProgress({ hello: "world" })).toBeNull();
    expect(parseProgress(42)).toBeNull();
  });
});

describe("statusMap", () => {
  it("uses the most recent attempt per item", () => {
    let p = emptyProgress();
    p = addAttempt(p, at("cs-01", false, 1));
    p = addAttempt(p, at("cs-01", true, 2));
    p = addAttempt(p, at("cs-02", true, 3));
    p = addAttempt(p, at("cs-02", false, 4));
    const m = statusMap(p);
    expect(m.get("cs-01")).toBe("correct");
    expect(m.get("cs-02")).toBe("incorrect");
  });

  it("lets a real attempt override a legacy completion", () => {
    const p = addAttempt({ ...emptyProgress(), legacyCompleted: ["cs-01", "cs-05"] }, at("cs-01", false, 1));
    const m = statusMap(p);
    expect(m.get("cs-01")).toBe("incorrect");
    expect(m.get("cs-05")).toBe("legacy");
  });
});

describe("mergeProgress", () => {
  it("unions attempts without duplicating identical ones", () => {
    const a = addAttempt(addAttempt(emptyProgress(), at("cs-01", true, 1)), at("cs-02", false, 2));
    const b = addAttempt(addAttempt(emptyProgress(), at("cs-02", false, 2)), at("cs-03", true, 3));
    const m = mergeProgress(a, { ...b, legacyCompleted: ["cs-09"] });
    expect(m.attempts.map((x) => x.itemId)).toEqual(["cs-01", "cs-02", "cs-03"]);
    expect(m.legacyCompleted).toEqual(["cs-09"]);
  });
});
