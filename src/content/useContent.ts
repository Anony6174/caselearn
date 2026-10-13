import { useEffect, useState } from "react";
import type { ContentIndex, Track, TrackFile } from "./schema";

// Content is validated by scripts/build-content.ts at build time, so no runtime checks here.
// Fetches are cached for the session so moving between pages doesn't refetch.

const cache = new Map<string, Promise<unknown>>();

function fetchJson<T>(url: string): Promise<T> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res.json();
    });
    p.catch(() => cache.delete(url)); // allow a retry after a failure
    cache.set(url, p);
  }
  return p as Promise<T>;
}

type Result<T> = { data: T | null; loading: boolean; error: string | null };

function useJson<T>(url: string | null): Result<T> {
  const [state, setState] = useState<{ url: string | null } & Result<T>>({
    url: null, data: null, loading: true, error: null,
  });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetchJson<T>(url).then(
      (data) => !cancelled && setState({ url, data, loading: false, error: null }),
      (err: Error) => !cancelled && setState({ url, data: null, loading: false, error: err.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Don't show the previous URL's data while a new one loads.
  if (state.url !== url) return { data: null, loading: url !== null, error: null };
  return state;
}

export function useContentIndex() {
  return useJson<ContentIndex>("/content/index.json");
}

/** Pass null (e.g. for an unknown track) to skip fetching. */
export function useTrack(track: Track | null) {
  return useJson<TrackFile>(track ? `/content/${track}.json` : null);
}
