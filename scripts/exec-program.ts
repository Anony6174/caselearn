// Runs a ProgramFiles bundle (from composeChallenge) with the local toolchain:
// python3, g++ or bash. Used by the build (to verify challenges against their
// reference solutions) and by the dev server's local runner (to run user code).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ProgramFiles } from "../src/runners/challenge.ts";

export interface ProgramResult {
  /** Which step produced this result: compiling (C++ only) or running. */
  stage: "compile" | "run";
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

// Sanitizers turn memory bugs (leaks, double frees, out-of-bounds) into clear
// error reports instead of silent corruption, which is most of the lesson.
export const CHALLENGE_CPP_FLAGS = [
  "-std=c++20", "-O0", "-g", "-Wall", "-Wextra", "-pthread",
  "-fsanitize=address,undefined", "-fno-sanitize-recover=all",
];

const COMPILE_TIMEOUT_MS = 30_000;
const RUN_TIMEOUT_MS = 10_000;
const MAX_OUTPUT = 256 * 1024;

const ENV = {
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  HOME: process.env.HOME ?? "/tmp",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8", // fixed collation, so `sort` behaves the same everywhere
  PYTHONHASHSEED: "0",
  PYTHONDONTWRITEBYTECODE: "1",
  ASAN_OPTIONS: "detect_leaks=1",
};

function run(cmd: string, args: string[], cwd: string, timeoutMs: number): Promise<Omit<ProgramResult, "stage">> {
  return new Promise((resolve) => {
    // detached: own process group, so a timeout kills children (e.g. `sleep`) too.
    const child = spawn(cmd, args, { cwd, env: { ...ENV, TMPDIR: cwd }, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const append = (cur: string, chunk: Buffer) =>
      cur.length >= MAX_OUTPUT ? cur : (cur + chunk.toString("utf8")).slice(0, MAX_OUTPUT);
    child.stdout.on("data", (c: Buffer) => (stdout = append(stdout, c)));
    child.stderr.on("data", (c: Buffer) => (stderr = append(stderr, c)));
    const kill = () => {
      try {
        process.kill(-child.pid!, "SIGKILL");
      } catch {
        /* already gone */
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: `${stderr}${err.message}\n`, exitCode: null, timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      kill(); // reap anything the program left running in the background
      if (stdout.length >= MAX_OUTPUT || stderr.length >= MAX_OUTPUT) stderr += "\n[output truncated]\n";
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });
  });
}

export async function runProgram(program: ProgramFiles): Promise<ProgramResult> {
  const dir = mkdtempSync(join(tmpdir(), "caselearn-run-"));
  try {
    for (const [name, body] of Object.entries(program.files)) writeFileSync(join(dir, name), body);
    switch (program.language) {
      case "python":
        return { stage: "run", ...(await run("python3", ["-I", "main.py"], dir, RUN_TIMEOUT_MS)) };
      case "bash":
        return { stage: "run", ...(await run("bash", ["--noprofile", "--norc", "main.sh"], dir, RUN_TIMEOUT_MS)) };
      case "cpp": {
        const compiled = await run("g++", [...CHALLENGE_CPP_FLAGS, "main.cpp", "-o", "main"], dir, COMPILE_TIMEOUT_MS);
        if (compiled.exitCode !== 0) return { stage: "compile", ...compiled };
        return { stage: "run", ...(await run("./main", [], dir, RUN_TIMEOUT_MS)) };
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
