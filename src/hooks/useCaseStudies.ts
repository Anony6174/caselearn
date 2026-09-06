import { useState, useEffect } from "react";
import type { CaseStudiesFile, CaseStudy } from "../types/caseStudy";
import { validateCaseStudy } from "../types/caseStudy";

interface UseCaseStudiesResult {
  caseStudies: CaseStudy[];
  loading: boolean;
  error: string | null;
}

export function useCaseStudies(): UseCaseStudiesResult {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/case-studies/case_studies.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<CaseStudiesFile>;
      })
      .then((data) => {
        data.case_studies.forEach(validateCaseStudy);
        setCaseStudies(data.case_studies);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { caseStudies, loading, error };
}
