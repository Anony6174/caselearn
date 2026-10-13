import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Preludes } from "../src/runners/challenge.ts";

const DIR = join(import.meta.dirname, "..", "src", "runners", "preludes");
const read = (name: string) => readFileSync(join(DIR, name), "utf8");

export const PRELUDES: Preludes = {
  python: read("prelude.py"),
  cppPrelude: read("prelude.hpp"),
  cppEpilogue: read("epilogue.cpp"),
  bash: read("prelude.sh"),
};
