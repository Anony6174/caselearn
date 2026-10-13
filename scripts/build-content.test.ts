import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "./build-content.ts";

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
