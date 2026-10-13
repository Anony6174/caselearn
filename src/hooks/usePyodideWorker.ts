import { useState, useEffect, useRef, useCallback } from "react";

export type WorkerStatus = "idle" | "loading" | "ready" | "running" | "stopped";

export interface OutputItem {
  kind: "stdout" | "stderr" | "figure";
  text?: string;
  data?: string; // base64 PNG for figures
}

export interface CollectedRun {
  stdout: string;
  stderr: string;
  /** The run was cancelled with stop(). */
  stopped: boolean;
}

interface Options {
  /** Plain Python only: skip numpy/pandas/scipy/sklearn/matplotlib for a much faster start. */
  light?: boolean;
  /** When false, no worker is started (e.g. a C++ challenge on the same page). */
  enabled?: boolean;
}

interface UsePyodideWorkerResult {
  status: WorkerStatus;
  loadingText: string;
  output: OutputItem[];
  run: (code: string) => void;
  /** Runs a whole program in a fresh namespace and resolves with everything it printed. */
  runCollect: (code: string) => Promise<CollectedRun>;
  stop: () => void;
  clearOutput: () => void;
}

interface Collector {
  stdout: string[];
  stderr: string[];
  resolve: (r: CollectedRun) => void;
}

export function usePyodideWorker({ light = false, enabled = true }: Options = {}): UsePyodideWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const collectorRef = useRef<Collector | null>(null);
  const [status, setStatus] = useState<WorkerStatus>(enabled ? "loading" : "idle");
  const [loadingText, setLoadingText] = useState("Booting Python environment…");
  const [output, setOutput] = useState<OutputItem[]>([]);

  const createWorker = useCallback(() => {
    const w = new Worker(light ? "/pyodide-worker.js?light=1" : "/pyodide-worker.js");
    w.onmessage = (e) => {
      const msg = e.data as { type: string; text?: string; data?: string };
      const collector = collectorRef.current;
      switch (msg.type) {
        case "loading":
          setStatus("loading");
          setLoadingText(msg.text ?? "Loading…");
          break;
        case "ready":
          setStatus("ready");
          break;
        case "stdout":
          collector?.stdout.push(msg.text ?? "");
          setOutput((prev) => [...prev, { kind: "stdout", text: msg.text }]);
          break;
        case "stderr":
          collector?.stderr.push(msg.text ?? "");
          setOutput((prev) => [...prev, { kind: "stderr", text: msg.text }]);
          break;
        case "figure":
          setOutput((prev) => [...prev, { kind: "figure", data: msg.data }]);
          break;
        case "error":
          setOutput((prev) => [...prev, { kind: "stderr", text: msg.text }]);
          setStatus("ready");
          break;
        case "done":
          if (collector) {
            collectorRef.current = null;
            collector.resolve({ stdout: collector.stdout.join("\n"), stderr: collector.stderr.join("\n"), stopped: false });
          }
          setStatus("ready");
          break;
      }
    };
    w.onerror = (e) => {
      setOutput((prev) => [...prev, { kind: "stderr", text: `Worker error: ${e.message}` }]);
      setStatus("ready");
    };
    return w;
  }, [light]);

  // Create the worker once on mount
  useEffect(() => {
    if (!enabled) return;
    const w = createWorker();
    workerRef.current = w;
    return () => {
      w.terminate();
    };
  }, [createWorker, enabled]);

  const run = useCallback((code: string) => {
    if (!workerRef.current || status === "loading" || status === "running") return;
    setOutput([]);
    setStatus("running");
    workerRef.current.postMessage({ type: "run", code });
  }, [status]);

  const runCollect = useCallback((code: string) => {
    return new Promise<CollectedRun>((resolve, reject) => {
      if (!workerRef.current || status !== "ready") {
        reject(new Error("Python isn't ready yet"));
        return;
      }
      collectorRef.current = { stdout: [], stderr: [], resolve };
      setOutput([]);
      setStatus("running");
      workerRef.current.postMessage({ type: "run", code, fresh: true });
    });
  }, [status]);

  const stop = useCallback(() => {
    // Pyodide can't be interrupted mid-run: terminate the worker and start a fresh one.
    workerRef.current?.terminate();
    const collector = collectorRef.current;
    if (collector) {
      collectorRef.current = null;
      collector.resolve({ stdout: collector.stdout.join("\n"), stderr: collector.stderr.join("\n"), stopped: true });
    }
    workerRef.current = createWorker();
    setStatus("loading");
    setLoadingText("Restarting Python environment…");
    setOutput([]);
  }, [createWorker]);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  return { status, loadingText, output, run, runCollect, stop, clearOutput };
}
