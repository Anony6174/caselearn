import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  V1_KEY, V2_KEY, addAttempt, loadFromStrings, mergeProgress, parseProgress, statusMap,
  type Attempt, type ProgressV2,
} from "../progress/progress";

// Module-level store so every component sees the same progress.

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

let state: ProgressV2 = loadFromStrings(readStorage(V2_KEY), readStorage(V1_KEY));
const listeners = new Set<() => void>();

function setState(next: ProgressV2) {
  state = next;
  try {
    localStorage.setItem(V2_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: progress lasts for this session only */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, () => state);
  const statuses = useMemo(() => statusMap(progress), [progress]);

  const recordAttempt = useCallback((a: Omit<Attempt, "ts">) => {
    setState(addAttempt(state, { ...a, ts: Date.now() }));
  }, []);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), []);

  /** Merge an exported progress file into the current progress. Returns false if the file isn't recognised. */
  const importJson = useCallback((text: string): boolean => {
    let incoming: ProgressV2 | null = null;
    try {
      incoming = parseProgress(JSON.parse(text));
    } catch {
      return false;
    }
    if (!incoming) return false;
    setState(mergeProgress(state, incoming));
    return true;
  }, []);

  const statusOf = useCallback((id: string) => statuses.get(id) ?? "unseen", [statuses]);

  return { progress, statuses, statusOf, recordAttempt, exportJson, importJson };
}
