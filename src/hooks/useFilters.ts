import { useState, useCallback, useMemo } from "react";
import type { CaseStudy, Difficulty } from "../types/caseStudy";

export function useFilters(caseStudies: CaseStudy[]) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // All unique topics across all case studies, sorted
  const allTopics = useMemo<string[]>(() => {
    const set = new Set<string>();
    caseStudies.forEach((cs) => cs.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [caseStudies]);

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedDifficulty("all");
    setSelectedTopics([]);
  }, []);

  const filtered = useMemo<CaseStudy[]>(() => {
    return caseStudies.filter((cs) => {
      const diffOk = selectedDifficulty === "all" || cs.difficulty === selectedDifficulty;
      const topicOk =
        selectedTopics.length === 0 || selectedTopics.some((t) => cs.topics.includes(t));
      return diffOk && topicOk;
    });
  }, [caseStudies, selectedDifficulty, selectedTopics]);

  return {
    allTopics,
    selectedTopics,
    selectedDifficulty,
    toggleTopic,
    setSelectedDifficulty,
    clearFilters,
    filtered,
  };
}
