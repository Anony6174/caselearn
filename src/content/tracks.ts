// Runtime constants the app needs. Kept free of zod so importing them doesn't
// pull the validator into the browser bundle.

export const TRACKS = [
  "ml-stats", "dsa", "cpp", "python", "asm", "arch", "os", "dbms", "cn", "oop",
  "python-prog", "cpp-prog", "bash",
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
  "python-prog": "Python Programming",
  "cpp-prog": "C++ Programming",
  bash: "Bash & Shell",
};

/** Home page grouping. */
export const SECTIONS: { title: string; blurb: string; tracks: Track[] }[] = [
  {
    title: "Concepts",
    blurb: "Predict, explain and pick: reasoning about how things work.",
    tracks: ["ml-stats", "cpp", "python", "os", "dsa", "asm", "arch", "dbms", "cn", "oop"],
  },
  {
    title: "Programming",
    blurb: "Write real code against tests: classes, resource management, design patterns, scripting.",
    tracks: ["python-prog", "cpp-prog", "bash"],
  },
];

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
  "python-prog": "Classes and the data model, decorators, context managers, iterators, patterns.",
  "cpp-prog": "RAII and the rule of five, templates, operator overloading, polymorphism, threads.",
  bash: "Arguments, exit codes, quoting, pipelines and text processing that survive real filenames.",
};
