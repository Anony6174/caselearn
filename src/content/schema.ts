import { z } from "zod";

// Shared between the build script (runtime validation) and the app (types only,
// via `import type`, so zod never ships to the browser).

export const TRACKS = [
  "ml-stats", "dsa", "cpp", "python", "asm", "arch", "os", "dbms", "cn", "oop",
] as const;

export const TRACK_TITLES: Record<Track, string> = {
  "ml-stats": "ML & Statistics",
  dsa: "Data Structures & Algorithms",
  cpp: "C++",
  python: "Python",
  asm: "Assembly (x86-64)",
  arch: "Computer Architecture",
  os: "Operating Systems",
  dbms: "Databases & SQL",
  cn: "Computer Networks",
  oop: "OOP & Low-Level Design",
};

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

// Phase 1 adds predict-output, concept and code-challenge to this union.
export const ItemSchema = z.discriminatedUnion("type", [CaseMcqItemSchema]);

export type Track = z.infer<typeof TrackSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type CaseMcqItem = z.infer<typeof CaseMcqItemSchema>;
export type Item = z.infer<typeof ItemSchema>;

export interface TrackSummary {
  id: Track;
  title: string;
  count: number;
  topics: string[];
}

export interface ContentIndex {
  schema_version: 2;
  tracks: TrackSummary[];
}

export interface TrackFile {
  track: Track;
  items: Item[];
}
