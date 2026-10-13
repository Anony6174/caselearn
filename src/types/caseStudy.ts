// Names the existing components use. The source of truth is src/content/schema.ts.
import type { CaseMcqItem } from "../content/schema";

export type { Difficulty } from "../content/schema";
export type CaseStudy = CaseMcqItem;
export type Experimentation = NonNullable<CaseMcqItem["experimentation"]>;
