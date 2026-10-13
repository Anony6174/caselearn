// Code challenges: how a user's solution and an item's test harness are put
// together into runnable files, and how test results are read back.
// Pure (no DOM, no Node), so the app and the build script share it; each
// side loads the prelude files (./preludes/*) its own way.
//
// Protocol: the harness prints one line per test,
//   @@CL{"name": "...", "pass": true|false, "detail": "..."}
// Every other line is ordinary program output.

export type ChallengeLanguage = "python" | "cpp" | "bash";

export interface Preludes {
  python: string; // prelude.py
  cppPrelude: string; // prelude.hpp
  cppEpilogue: string; // epilogue.cpp
  bash: string; // prelude.sh
}

export interface ProgramFiles {
  language: ChallengeLanguage;
  /** File name -> contents. The entry point is main.py / main.cpp / main.sh. */
  files: Record<string, string>;
}

export interface TestResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const MARKER = "@@CL";

/**
 * Builds the files to run for `userCode` + an item's `harness`. The user's
 * code always comes first, so line numbers in compiler errors and tracebacks
 * match what they see in the editor.
 */
export function composeChallenge(
  language: ChallengeLanguage,
  userCode: string,
  harness: string,
  preludes: Preludes,
): ProgramFiles {
  switch (language) {
    case "python":
      return { language, files: { "main.py": `${userCode}\n${preludes.python}\n${harness}\n` } };
    case "cpp":
      return {
        language,
        files: { "main.cpp": `${userCode}\n${preludes.cppPrelude}\n${harness}\n${preludes.cppEpilogue}` },
      };
    case "bash":
      // The user's script stays a separate file, so the harness can run it
      // (bash "$SOLUTION" args) or source it to test its functions.
      return { language, files: { "solution.sh": userCode, "main.sh": `${preludes.bash}\n${harness}\n` } };
  }
}

/** Splits program output into test results and everything else. */
export function parseResults(stdout: string): { results: TestResult[]; output: string } {
  const results: TestResult[] = [];
  const other: string[] = [];
  for (const line of stdout.split("\n")) {
    const at = line.indexOf(MARKER);
    if (at === -1) {
      other.push(line);
      continue;
    }
    try {
      const r = JSON.parse(line.slice(at + MARKER.length));
      if (typeof r.name === "string" && typeof r.pass === "boolean") {
        if (at > 0) other.push(line.slice(0, at)); // user output printed without a trailing newline
        results.push({ name: r.name, pass: r.pass, ...(typeof r.detail === "string" ? { detail: r.detail } : {}) });
        continue;
      }
    } catch {
      /* not a result line after all: treat it as output */
    }
    other.push(line);
  }
  return { results, output: other.join("\n").replace(/\n+$/, "") };
}
