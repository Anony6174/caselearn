import { describe, expect, it } from "vitest";
import { normalizeOutput, predictOptions } from "./output";

describe("normalizeOutput", () => {
  it("ignores trailing spaces, CRLF and surrounding blank lines", () => {
    expect(normalizeOutput("\n2 3 4 \r\nok  \n\n")).toBe("2 3 4\nok");
  });

  it("keeps leading spaces and inner blank lines", () => {
    expect(normalizeOutput("  a\n\nb")).toBe("  a\n\nb");
  });
});

describe("predictOptions", () => {
  const opts = (id: string) => predictOptions(id, "real\n", ["x", "y", "z"]);

  it("includes the real output exactly once, plus every distractor", () => {
    const o = opts("py-x-001");
    expect(o.map((x) => x.text).sort()).toEqual(["real", "x", "y", "z"]);
    expect(o.filter((x) => x.correct)).toHaveLength(1);
    expect(o.map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("is stable for an id and varies across ids", () => {
    expect(opts("cpp-ref-001")).toEqual(opts("cpp-ref-001"));
    const positions = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => opts(`item-${s}`).findIndex((x) => x.correct)),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

import { makeRunnable } from "./runnable";

describe("makeRunnable", () => {
  const src = [
    "x = 1",
    "# a normal comment",
    "# Try it yourself:",
    "# print(x)",
    "# y = x + 1",
    "# Then sweep probability thresholds and find the best F1.",
    "# Compare the two strategies.",
    "# A practical version would use a pretrained backbone,",
    "# freeze its parameters, then unfreeze later blocks",
    "# with a smaller learning rate.",
    "# z = y * 2",
  ].join("\n");

  it("uncomments code after the marker but keeps prose as comments", () => {
    const out = makeRunnable(src).split("\n");
    expect(out[1]).toBe("# a normal comment"); // before the marker: untouched
    expect(out[3]).toBe("print(x)");
    expect(out[4]).toBe("y = x + 1");
    expect(out[5]).toBe("# Then sweep probability thresholds and find the best F1.");
    expect(out[6]).toBe("# Compare the two strategies.");
    expect(out.slice(7, 10).every((l) => l.startsWith("# "))).toBe(true); // wrapped sentence stays a comment
    expect(out[10]).toBe("z = y * 2"); // code after the sentence is uncommented again
  });
});
