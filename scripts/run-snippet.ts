// Runs predict-output snippets locally so their expected output is computed,
// never hand-written. Results are cached by content hash, so only new or
// edited snippets run on each build.

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { SnippetLanguage } from "../src/content/schema.ts";

const run = promisify(execFile);
const TIMEOUT_MS = 10_000;

// UB in C++ snippets would make the "expected output" meaningless, so compile
// with sanitizers and fail the build if they fire.
export const CPP_FLAGS = [
  "-std=c++20", "-O0", "-g",
  "-fsanitize=address,undefined", "-fno-sanitize-recover=all",
];

async function exec(cmd: string, args: string[], env?: Record<string, string>) {
  try {
    const { stdout } = await run(cmd, args, {
      timeout: TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, ...env },
    });
    return stdout;
  } catch (e) {
    const err = e as { stderr?: string; killed?: boolean; code?: number | string; message: string };
    if (err.killed) throw new Error(`timed out after ${TIMEOUT_MS / 1000}s`);
    if (err.code === "ENOENT") throw new Error(`"${cmd}" not found — install it to build predict-output items`);
    const detail = (err.stderr ?? "").trim().split("\n").slice(-8).join("\n    ");
    throw new Error(`exit ${err.code}${detail ? `:\n    ${detail}` : ""}`);
  }
}

async function runPython(dir: string, code: string): Promise<string> {
  const file = join(dir, "main.py");
  writeFileSync(file, code);
  // Two different hash seeds: catches output that depends on set/dict-of-str ordering,
  // which would differ in the browser.
  const a = await exec("python3", ["-I", file], { PYTHONHASHSEED: "0" });
  const b = await exec("python3", ["-I", file], { PYTHONHASHSEED: "1" });
  if (a !== b) throw new Error("output is not deterministic (depends on hash seed — e.g. iterating a set of strings)");
  return a;
}

async function runCpp(dir: string, code: string): Promise<string> {
  const src = join(dir, "main.cpp");
  const bin = join(dir, "main");
  writeFileSync(src, code);
  try {
    await exec("g++", [...CPP_FLAGS, src, "-o", bin]);
  } catch (e) {
    throw new Error(`compile failed: ${(e as Error).message}`);
  }
  return exec(bin, [], { ASAN_OPTIONS: "detect_leaks=1" });
}

export async function runSnippet(language: SnippetLanguage, code: string): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "caselearn-snippet-"));
  try {
    return language === "python" ? await runPython(dir, code) : await runCpp(dir, code);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Throws if `code` isn't syntactically valid Python (it is not executed). */
export async function checkPythonSyntax(code: string): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "caselearn-syntax-"));
  try {
    const file = join(dir, "main.py");
    writeFileSync(file, code);
    await exec("python3", ["-I", "-c", "import ast, sys; ast.parse(open(sys.argv[1]).read())", file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A JSON file cache: hash(language, flags, code) -> stdout. */
export class SnippetCache {
  private data: Record<string, string> = {};
  private dirty = false;
  private readonly dir: string;
  private readonly file: string;

  constructor(dir: string) {
    this.dir = dir;
    this.file = join(dir, "snippet-outputs.json");
    try {
      this.data = JSON.parse(readFileSync(this.file, "utf8"));
    } catch {
      /* no cache yet */
    }
  }

  static key(language: SnippetLanguage, code: string): string {
    const flags = language === "cpp" ? CPP_FLAGS.join(" ") : "";
    return createHash("sha256").update(`${language}\0${flags}\0${code}`).digest("hex");
  }

  get(key: string): string | undefined {
    return this.data[key];
  }

  set(key: string, value: string) {
    this.data[key] = value;
    this.dirty = true;
  }

  save() {
    if (!this.dirty) return;
    mkdirSync(this.dir, { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.data));
  }
}
