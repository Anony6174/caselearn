import { useCallback, useEffect, useState } from "react";
import { composeChallenge, parseResults, type ChallengeLanguage, type TestResult } from "./challenge";
import { PRELUDES } from "./preludes.browser";
import { usePyodideWorker } from "../hooks/usePyodideWorker";

export interface ChallengeRun {
  results: TestResult[];
  /** Program output other than test results. */
  output: string;
  stderr: string;
  stage: "compile" | "run";
  exitCode: number | null;
  timedOut: boolean;
}

export type RunnerStatus =
  | "loading" // Python booting / checking for the local runner
  | "ready"
  | "running"
  | "unavailable"; // C++/Bash on a static deploy

// One check per page load: is the dev server's local runner here?
let localCheck: Promise<boolean> | null = null;
function hasLocalRunner(): Promise<boolean> {
  localCheck ??= fetch("/api/health", { cache: "no-store" })
    .then(async (r) => r.ok && (await r.json()).ok === true)
    .catch(() => false);
  return localCheck;
}

async function runLocally(files: ReturnType<typeof composeChallenge>): Promise<ChallengeRun> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-caselearn-run": "1" },
    body: JSON.stringify(files),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  const { results, output } = parseResults(body.stdout);
  return { results, output, stderr: body.stderr, stage: body.stage, exitCode: body.exitCode, timedOut: body.timedOut };
}

/** Runs a solution against a challenge's harness: Python in the browser, C++/Bash via the local runner. */
export function useChallengeRunner(language: ChallengeLanguage) {
  const isPython = language === "python";
  const py = usePyodideWorker({ light: true, enabled: isPython });
  const [local, setLocal] = useState<"checking" | "yes" | "no">("checking");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (isPython) return;
    let cancelled = false;
    hasLocalRunner().then((ok) => !cancelled && setLocal(ok ? "yes" : "no"));
    return () => {
      cancelled = true;
    };
  }, [isPython]);

  let status: RunnerStatus;
  if (isPython) status = py.status === "ready" ? "ready" : py.status === "running" ? "running" : "loading";
  else status = local === "checking" ? "loading" : local === "no" ? "unavailable" : running ? "running" : "ready";

  const { runCollect } = py;
  const run = useCallback(
    async (userCode: string, harness: string): Promise<ChallengeRun> => {
      const program = composeChallenge(language, userCode, harness, PRELUDES);
      if (language === "python") {
        const r = await runCollect(program.files["main.py"]);
        const { results, output } = parseResults(r.stdout);
        return { results, output, stderr: r.stderr, stage: "run", exitCode: null, timedOut: r.stopped };
      }
      setRunning(true);
      try {
        return await runLocally(program);
      } finally {
        setRunning(false);
      }
    },
    [language, runCollect],
  );

  return {
    status,
    loadingText: isPython ? py.loadingText : "Checking for the local runner…",
    run,
    /** Python only: abandon a run that's taking too long (e.g. an infinite loop). */
    stop: isPython ? py.stop : undefined,
  };
}
