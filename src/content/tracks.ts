// Runtime constants the app needs. Kept free of zod so importing them doesn't
// pull the validator into the browser bundle.

export const TRACKS = [
  "ml-stats", "dsa", "cpp", "python", "asm", "arch", "os", "dbms", "cn", "oop",
] as const;

export type Track = (typeof TRACKS)[number];

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

export function asTrack(s: string | undefined): Track | null {
  return (TRACKS as readonly string[]).includes(s ?? "") ? (s as Track) : null;
}

export const TRACK_BLURBS: Record<Track, string> = {
  "ml-stats": "Pick the right metric, test or model for a messy, realistic scenario.",
  dsa: "Patterns, trade-offs and complexity, not memorised solutions.",
  cpp: "Value vs reference, object lifetimes, virtual dispatch, move semantics.",
  python: "Names and objects, mutability, closures, generators, the GIL.",
  asm: "Read what the compiler actually produced.",
  arch: "Caches, locality, pipelines and branch prediction.",
  os: "Processes, threads, scheduling, virtual memory, deadlock.",
  dbms: "Indexes, transactions, isolation levels and SQL.",
  cn: "TCP, DNS, HTTP, and what happens when you type a URL.",
  oop: "Composition, interfaces and low-level design.",
};
