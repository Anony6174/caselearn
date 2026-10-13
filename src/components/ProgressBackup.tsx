import { useRef, useState, type ChangeEvent } from "react";
import { useProgress } from "../hooks/useProgress";

// Progress lives only in this browser's localStorage, so offer a manual backup.
export function ProgressBackup() {
  const { exportJson, importJson } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caselearn-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ok = importJson(await file.text());
    setMessage(ok ? "Progress imported and merged." : "That file isn't a CaseLearn progress export.");
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-text-faint)]">
      <span>Progress is saved in this browser only.</span>
      <button onClick={handleExport} className="link">
        Export
      </button>
      <button onClick={() => fileRef.current?.click()} className="link">
        Import
      </button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
      {message && <span role="status" className="text-[var(--color-text-muted)]">{message}</span>}
    </div>
  );
}
