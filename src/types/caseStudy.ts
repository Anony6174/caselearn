export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface CaseStudyOption {
  id: string;
  text: string;
  is_correct: boolean;
  explanation: string;
}

export interface Experimentation {
  objective: string;
  data_generation_code: string;
  suggested_exploration: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  topics: string[];
  difficulty: Difficulty;
  scenario: string;
  question: string;
  options: CaseStudyOption[];
  correct_option_id: string;
  key_takeaway: string;
  common_misconception: string;
  experimentation: Experimentation;
}

export interface CaseStudiesFile {
  meta: {
    schema_version: string;
    description: string;
    difficulty_levels: Difficulty[];
    topics_covered: string[];
    count: number;
  };
  case_studies: CaseStudy[];
}

export function validateCaseStudy(cs: CaseStudy): boolean {
  if (cs.options.length !== 4) {
    console.warn(`[validateCaseStudy] ${cs.id}: expected 4 options, got ${cs.options.length}`);
    return false;
  }
  const correct = cs.options.filter((o) => o.is_correct);
  if (correct.length !== 1) {
    console.warn(`[validateCaseStudy] ${cs.id}: expected exactly 1 correct option, got ${correct.length}`);
    return false;
  }
  if (correct[0].id !== cs.correct_option_id) {
    console.warn(`[validateCaseStudy] ${cs.id}: correct_option_id mismatch`);
    return false;
  }
  return true;
}
