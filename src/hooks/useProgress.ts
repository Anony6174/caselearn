import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "caselearn_progress_v1";

interface ProgressStore {
  completed: string[]; // case study IDs
}

function load(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressStore;
  } catch {
    /* ignore */
  }
  return { completed: [] };
}

function save(store: ProgressStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function useProgress() {
  const [store, setStore] = useState<ProgressStore>(load);

  // Sync state → localStorage whenever it changes
  useEffect(() => {
    save(store);
  }, [store]);

  const markComplete = useCallback((id: string) => {
    setStore((prev) =>
      prev.completed.includes(id)
        ? prev
        : { ...prev, completed: [...prev.completed, id] }
    );
  }, []);

  const isComplete = useCallback(
    (id: string) => store.completed.includes(id),
    [store]
  );

  return { completed: store.completed, markComplete, isComplete };
}
