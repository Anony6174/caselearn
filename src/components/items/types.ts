import type { Attempt } from "../../progress/progress";

export type RecordAttempt = (attempt: Omit<Attempt, "ts">) => void;
