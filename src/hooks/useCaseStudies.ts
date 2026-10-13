import { useState, useEffect } from "react";
import type { TrackFile } from "../content/schema";
import type { CaseStudy } from "../types/caseStudy";

interface UseCaseStudiesResult {
  caseStudies: CaseStudy[];
  loading: boolean;
  error: string | null;
}

// Content is validated by scripts/build-content.ts at build time, so no runtime checks here.
export function useCaseStudies(): UseCaseStudiesResult {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/content/ml-stats.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<TrackFile>;
      })
      .then((data) => {
        setCaseStudies(data.items.filter((i): i is CaseStudy => i.type === "case-mcq"));
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { caseStudies, loading, error };
}
