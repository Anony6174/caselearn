import { z } from "zod";
import { TRACKS } from "./tracks.ts";

export { TRACKS, TRACK_TITLES } from "./tracks.ts";

// Shared between the build script (runtime validation) and the app.
// The app must only `import type` from here, so zod never ships to the browser;
// runtime constants the app needs live in ./tracks.ts.

export const TrackSchema = z.enum(TRACKS);
export const DifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

const BaseItemSchema = z.object({
  // Never renumber an id: progress is keyed by it.
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be kebab-case"),
  track: TrackSchema,
  title: z.string().min(1),
  topics: z.array(z.string().min(1)).min(1),
  difficulty: DifficultySchema,
  prerequisites: z.array(z.string()).optional(),
  sources: z.array(z.object({ title: z.string(), url: z.url() })).optional(),
  // Set to true only after you've checked the answer key yourself.
  verified: z.boolean(),
});

const OptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  is_correct: z.boolean(),
  explanation: z.string().min(1),
});

export const CaseMcqItemSchema = BaseItemSchema.extend({
  type: z.literal("case-mcq"),
  scenario: z.string().min(1),
  question: z.string().min(1),
  options: z.array(OptionSchema).length(4),
  correct_option_id: z.string(),
  key_takeaway: z.string().min(1),
  common_misconception: z.string().min(1),
  experimentation: z
    .object({
      objective: z.string(),
      data_generation_code: z.string(),
      suggested_exploration: z.string(),
    })
    .optional(),
}).superRefine((item, ctx) => {
  const correct = item.options.filter((o) => o.is_correct);
  if (correct.length !== 1) {
    ctx.addIssue({ code: "custom", message: `expected exactly 1 correct option, got ${correct.length}` });
  } else if (correct[0].id !== item.correct_option_id) {
    ctx.addIssue({ code: "custom", message: `correct_option_id "${item.correct_option_id}" != correct option "${correct[0].id}"` });
  }
  const ids = item.options.map((o) => o.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", message: "duplicate option ids" });
  }
});

export const SnippetLanguageSchema = z.enum(["python", "cpp"]);

// "What does this print?" The real output is computed by the build script
// (scripts/run-snippet.ts) and written into the bundle, never typed by hand.
export const PredictOutputItemSchema = BaseItemSchema.extend({
  type: z.literal("predict-output"),
  language: SnippetLanguageSchema,
  prompt: z.string().min(1).optional(), // defaults to "What does this print?"
  code: z.string().min(1),
  // Optional MCQ mode: plausible wrong outputs. Without these you type your prediction.
  distractors: z.array(z.string().min(1)).min(1).max(3).optional(),
  explanation: z.string().min(1),
  try_this: z.string().min(1).optional(), // a follow-up experiment for the sandbox
  expected_output: z.string().optional(), // set by the build; must not be in source files
});

// An open "why" question: write your answer, then grade it against key points.
export const ConceptItemSchema = BaseItemSchema.extend({
  type: z.literal("concept"),
  prompt: z.string().min(1),
  key_points: z.array(z.string().min(1)).min(2).max(6),
  model_answer: z.string().min(1),
  follow_ups: z.array(z.string().min(1)).default([]),
});

// Phase 3 adds code-challenge to this union.
export const ItemSchema = z.discriminatedUnion("type", [
  CaseMcqItemSchema,
  PredictOutputItemSchema,
  ConceptItemSchema,
]);

export type Track = z.infer<typeof TrackSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type SnippetLanguage = z.infer<typeof SnippetLanguageSchema>;
export type CaseMcqItem = z.infer<typeof CaseMcqItemSchema>;
export type PredictOutputItem = z.infer<typeof PredictOutputItemSchema>;
export type ConceptItem = z.infer<typeof ConceptItemSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type ItemType = Item["type"];

export interface TrackSummary {
  id: Track;
  title: string;
  count: number;
  topics: string[];
  item_ids: string[];
}

export interface ContentIndex {
  schema_version: 2;
  tracks: TrackSummary[];
}

export interface TrackFile {
  track: Track;
  items: Item[];
}
