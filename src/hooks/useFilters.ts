import { useState, useCallback, useMemo } from "react";
import type { Difficulty, Item } from "../content/schema";

export function useFilters(items: Item[]) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // All unique topics across all case studies, sorted
  const allTopics = useMemo<string[]>(() => {
    const set = new Set<string>();
    items.forEach((cs) => cs.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedDifficulty("all");
    setSelectedTopics([]);
  }, []);

  const filtered = useMemo<Item[]>(() => {
    return items.filter((cs) => {
      const diffOk = selectedDifficulty === "all" || cs.difficulty === selectedDifficulty;
      const topicOk =
        selectedTopics.length === 0 || selectedTopics.some((t) => cs.topics.includes(t));
      return diffOk && topicOk;
    });
  }, [items, selectedDifficulty, selectedTopics]);

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
