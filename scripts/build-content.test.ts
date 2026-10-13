import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeOutputs, loadContent } from "./build-content.ts";
import { SnippetCache } from "./run-snippet.ts";
import type { Item, PredictOutputItem } from "../src/content/schema.ts";

const contentDir = join(import.meta.dirname, "..", "content");
const sample = JSON.parse(readFileSync(join(contentDir, "ml-stats", "correlation", "cs-01.json"), "utf8"));

function tempContent(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), "caselearn-content-"));
  for (const [rel, data] of Object.entries(files)) {
    const p = join(dir, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data));
  }
  return dir;
}

describe("real content", () => {
  it("is all valid", () => {
    const { items, errors } = loadContent(contentDir);
    expect(errors).toEqual([]);
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("loadContent rejects", () => {
  it("an item whose correct_option_id doesn't match the correct option", () => {
    const dir = tempContent({ "ml-stats/x/cs-01.json": { ...sample, correct_option_id: "z" } });
    expect(loadContent(dir).errors.join()).toMatch(/correct_option_id/);
  });

  it("two correct options", () => {
    const options = sample.options.map((o: { is_correct: boolean }) => ({ ...o, is_correct: true }));
    const dir = tempContent({ "ml-stats/x/cs-01.json": { ...sample, options } });
    expect(loadContent(dir).errors.join()).toMatch(/exactly 1 correct option/);
  });

  it("duplicate ids across files", () => {
    const dir = tempContent({
      "ml-stats/a/cs-01.json": sample,
      "ml-stats/b/cs-01.json": sample,
    });
    expect(loadContent(dir).errors.join()).toMatch(/duplicate id "cs-01"/);
  });

  it("an item in the wrong track folder", () => {
    const dir = tempContent({ "os/x/cs-01.json": sample });
    expect(loadContent(dir).errors.join()).toMatch(/doesn't match folder/);
  });

  it("a file name that doesn't match the id", () => {
    const dir = tempContent({ "ml-stats/x/cs-99.json": sample });
    expect(loadContent(dir).errors.join()).toMatch(/file name must be/);
  });

  it("invalid JSON", () => {
    const dir = tempContent({ "ml-stats/x/cs-01.json": "{oops" });
    expect(loadContent(dir).errors.join()).toMatch(/invalid JSON/);
  });
});

// These spawn real python3 / g++ processes, which can be slow on a busy machine.
describe("computeOutputs", { timeout: 30_000 }, () => {
  const base: Omit<PredictOutputItem, "code"> = {
    id: "py-test-001", type: "predict-output", track: "python", title: "t", topics: ["x"],
    difficulty: "beginner", verified: false, language: "python", explanation: "e",
  };
  const cache = () => new SnippetCache(mkdtempSync(join(tmpdir(), "caselearn-cache-")));

  it("fills expected_output by running the code", async () => {
    const items: Item[] = [{ ...base, code: "print(6 * 7)" }];
    expect(await computeOutputs(items, cache())).toEqual([]);
    expect(items[0].type === "predict-output" && items[0].expected_output).toBe("42\n");
  });

  it("rejects a hand-written expected_output", async () => {
    const items: Item[] = [{ ...base, code: "print(1)", expected_output: "1\n" }];
    expect((await computeOutputs(items, cache())).join()).toMatch(/remove "expected_output"/);
  });

  it("rejects a distractor that equals the real output", async () => {
    const items: Item[] = [{ ...base, code: "print(1)", distractors: ["1 ", "2"] }];
    expect((await computeOutputs(items, cache())).join()).toMatch(/is the actual output/);
  });

  it("rejects output that depends on the hash seed", async () => {
    const items: Item[] = [{ ...base, code: "print(list({'apple', 'banana', 'cherry', 'date', 'elder'}))" }];
    expect((await computeOutputs(items, cache())).join()).toMatch(/not deterministic/);
  });

  it("rejects a crashing snippet", async () => {
    const items: Item[] = [{ ...base, code: "raise ValueError('boom')" }];
    expect((await computeOutputs(items, cache())).join()).toMatch(/ValueError: boom/);
  });

  it("rejects C++ undefined behaviour via the sanitizers", async () => {
    const code = "#include <climits>\n#include <iostream>\nint main(){ volatile int x = INT_MAX; std::cout << x + 1; }";
    const items: Item[] = [{ ...base, id: "cpp-test-001", track: "cpp", language: "cpp", code }];
    expect((await computeOutputs(items, cache())).join()).toMatch(/runtime error|overflow/);
  });
});
