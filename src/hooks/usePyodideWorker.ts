import { useState, useEffect, useRef, useCallback } from "react";

export type WorkerStatus = "idle" | "loading" | "ready" | "running" | "stopped";

export interface OutputItem {
  kind: "stdout" | "stderr" | "figure";
  text?: string;
  data?: string; // base64 PNG for figures
}

interface UsePyodideWorkerResult {
  status: WorkerStatus;
  loadingText: string;
  output: OutputItem[];
  run: (code: string) => void;
  stop: () => void;
  clearOutput: () => void;
}

function createWorker(): Worker {
  return new Worker("/pyodide-worker.js");
}

export function usePyodideWorker(): UsePyodideWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [loadingText, setLoadingText] = useState("Booting Python environment…");
  const [output, setOutput] = useState<OutputItem[]>([]);

  function attachWorker(w: Worker) {
    w.onmessage = (e) => {
      const msg = e.data as { type: string; text?: string; data?: string };
      switch (msg.type) {
        case "loading":
          setStatus("loading");
          setLoadingText(msg.text ?? "Loading…");
          break;
        case "ready":
          setStatus("ready");
          break;
        case "stdout":
          setOutput((prev) => [...prev, { kind: "stdout", text: msg.text }]);
          break;
        case "stderr":
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
          setStatus("ready");
          break;
      }
    };
    w.onerror = (e) => {
      setOutput((prev) => [...prev, { kind: "stderr", text: `Worker error: ${e.message}` }]);
      setStatus("ready");
    };
  }

  // Create worker once on mount
  useEffect(() => {
    const w = createWorker();
    workerRef.current = w;
    attachWorker(w);
    setStatus("loading");
    return () => {
      w.terminate();
    };
  }, []);

  const run = useCallback((code: string) => {
    if (!workerRef.current || status === "loading" || status === "running") return;
    setOutput([]);
    setStatus("running");
    workerRef.current.postMessage({ type: "run", code });
  }, [status]);

  const stop = useCallback(() => {
    // Terminate the running worker and spin up a fresh one
    workerRef.current?.terminate();
    const w = createWorker();
    workerRef.current = w;
    attachWorker(w);
    setStatus("loading");
    setLoadingText("Restarting Python environment…");
    setOutput([]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  return { status, loadingText, output, run, stop, clearOutput };
}
