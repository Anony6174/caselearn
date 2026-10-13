// Validates every item under content/ and bundles them into public/content/.
// Run with `npm run content` (also runs automatically before dev/build/test).
// Exits non-zero on any invalid item so a bad hand edit can't ship.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  ItemSchema, TRACKS, TRACK_TITLES,
  type ContentIndex, type Item, type Track, type TrackFile,
} from "../src/content/schema.ts";
import { normalizeOutput } from "../src/content/output.ts";
import { SnippetCache, checkPythonSyntax, runSnippet } from "./run-snippet.ts";
import { makeRunnable } from "../src/content/runnable.ts";
import { composeChallenge, parseResults, type TestResult } from "../src/runners/challenge.ts";
import { CHALLENGE_CPP_FLAGS, runProgram, type ProgramResult } from "./exec-program.ts";
import { PRELUDES } from "./preludes.node.ts";
import { createHash } from "node:crypto";

const ROOT = join(import.meta.dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const OUT_DIR = join(ROOT, "public", "content");
const CACHE_DIR = join(ROOT, "node_modules", ".cache", "caselearn");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return name.endsWith(".json") ? [p] : [];
  });
}

export function loadContent(contentDir = CONTENT_DIR): { items: Item[]; errors: string[] } {
  const items: Item[] = [];
  const errors: string[] = [];
  const seen = new Map<string, string>();

  for (const file of walk(contentDir).sort()) {
    const rel = relative(contentDir, file);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      errors.push(`${rel}: invalid JSON (${(e as Error).message})`);
      continue;
    }
    const parsed = ItemSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${rel}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      continue;
    }
    const item = parsed.data;
    const trackDir = rel.split(/[\\/]/)[0];
    if (trackDir !== item.track) {
      errors.push(`${rel}: track "${item.track}" doesn't match folder "${trackDir}"`);
    }
    if (!rel.endsWith(`${item.id}.json`)) {
      errors.push(`${rel}: file name must be "${item.id}.json"`);
    }
    const dup = seen.get(item.id);
    if (dup) errors.push(`${rel}: duplicate id "${item.id}" (also in ${dup})`);
    seen.set(item.id, rel);
    items.push(item);
  }
  return { items, errors };
}

/**
 * Runs every predict-output snippet and stores its real stdout in
 * `expected_output`. Mutates items in place; returns errors.
 */
export async function computeOutputs(items: Item[], cache: SnippetCache): Promise<string[]> {
  const errors: string[] = [];
  await Promise.all(
    items.map(async (item) => {
      if (item.type !== "predict-output") return;
      if (item.expected_output !== undefined) {
        errors.push(`${item.id}: remove "expected_output" — the build computes it by running the code`);
        return;
      }
      const key = SnippetCache.key(item.language, item.code);
      let out = cache.get(key);
      if (out === undefined) {
        try {
          out = await runSnippet(item.language, item.code);
        } catch (e) {
          errors.push(`${item.id}: running the ${item.language} snippet failed: ${(e as Error).message}`);
          return;
        }
        cache.set(key, out);
      }
      if (normalizeOutput(out) === "") {
        errors.push(`${item.id}: snippet prints nothing`);
        return;
      }
      for (const d of item.distractors ?? []) {
        if (normalizeOutput(d) === normalizeOutput(out)) {
          errors.push(`${item.id}: distractor ${JSON.stringify(d)} is the actual output`);
        }
      }
      item.expected_output = out;
    }),
  );
  return errors.sort();
}

const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

// Within a track: easiest first, so "next" walks a sensible learning path.
/** Checks that each case study's sandbox code (after uncommenting) is valid Python. */
export async function checkExperiments(items: Item[], cache: SnippetCache): Promise<string[]> {
  const errors: string[] = [];
  await Promise.all(
    items.map(async (item) => {
      if (item.type !== "case-mcq" || !item.experimentation) return;
      const code = makeRunnable(item.experimentation.data_generation_code);
      const key = `syntax:${SnippetCache.key("python", code)}`;
      if (cache.get(key) !== undefined) return;
      try {
        await checkPythonSyntax(code);
        cache.set(key, "ok");
      } catch (e) {
        errors.push(`${item.id}: sandbox code isn't valid Python: ${(e as Error).message}`);
      }
    }),
  );
  return errors.sort();
}

type ChallengeRun = { results: TestResult[]; result: Omit<ProgramResult, "stdout"> };

async function runChallengeCached(
  language: "python" | "cpp" | "bash",
  code: string,
  harness: string,
  cache: SnippetCache,
): Promise<ChallengeRun> {
  const program = composeChallenge(language, code, harness, PRELUDES);
  const key = "challenge:" + createHash("sha256")
    .update(JSON.stringify([program, language === "cpp" ? CHALLENGE_CPP_FLAGS : []]))
    .digest("hex");
  const hit = cache.get(key);
  if (hit !== undefined) return JSON.parse(hit);
  const { stdout, ...result } = await runProgram(program);
  const run: ChallengeRun = { results: parseResults(stdout).results, result };
  if (!result.timedOut) cache.set(key, JSON.stringify(run)); // don't cache flaky timeouts
  return run;
}

function describeFailure(run: ChallengeRun): string {
  const { result, results } = run;
  const failed = results.filter((r) => !r.pass).map((r) => `${r.name}: ${r.detail ?? "failed"}`);
  const stderr = result.stderr.trim().split("\n").slice(-8).join("\n      ");
  return [
    result.timedOut ? "timed out" : `${result.stage} exit ${result.exitCode}`,
    ...failed,
    ...(stderr ? [`stderr:\n      ${stderr}`] : []),
  ].join("\n    ");
}

/**
 * For each code challenge: the reference solution must pass every test (at
 * least 3, unique names, clean exit), and the starter code must run but fail
 * at least one. Records the test names on the item.
 */
export async function verifyChallenges(items: Item[], cache: SnippetCache): Promise<string[]> {
  const errors: string[] = [];
  await Promise.all(
    items.map(async (item) => {
      if (item.type !== "code-challenge") return;
      if (item.test_names !== undefined) {
        errors.push(`${item.id}: remove "test_names" — the build records them from the harness`);
        return;
      }
      const ref = await runChallengeCached(item.language, item.reference_solution, item.harness, cache);
      const names = ref.results.map((r) => r.name);
      if (ref.result.exitCode !== 0 || ref.results.some((r) => !r.pass) || ref.results.length === 0) {
        errors.push(`${item.id}: reference solution doesn't pass the harness:\n    ${describeFailure(ref)}`);
        return;
      }
      if (names.length < 3) errors.push(`${item.id}: needs at least 3 tests, has ${names.length}`);
      if (new Set(names).size !== names.length) errors.push(`${item.id}: duplicate test names`);

      const starter = await runChallengeCached(item.language, item.starter_code, item.harness, cache);
      if (starter.result.stage === "compile") {
        errors.push(`${item.id}: starter code must compile (stub it out):\n    ${describeFailure(starter)}`);
      } else if (starter.results.length === names.length && starter.results.every((r) => r.pass)) {
        errors.push(`${item.id}: starter code already passes every test`);
      }
      item.test_names = names;
    }),
  );
  return errors.sort();
}

function itemOrder(a: Item, b: Item) {
  return (
    DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
    a.id.localeCompare(b.id, "en", { numeric: true })
  );
}

async function main() {
  const { items, errors } = loadContent();
  const cache = new SnippetCache(CACHE_DIR);
  errors.push(
    ...(await computeOutputs(items, cache)),
    ...(await checkExperiments(items, cache)),
    ...(await verifyChallenges(items, cache)),
  );
  cache.save();
  if (errors.length > 0) {
    console.error(`✗ content: ${errors.length} problem(s)\n  ` + errors.join("\n  "));
    process.exit(1);
  }

  // Update files in place rather than deleting the directory: a running Vite
  // dev server loses track of deleted-then-recreated public files and starts
  // serving index.html for them.
  mkdirSync(OUT_DIR, { recursive: true });
  const written = new Set<string>();
  const output = (name: string, body: string) => {
    written.add(name);
    const path = join(OUT_DIR, name);
    let current: string | null = null;
    try {
      current = readFileSync(path, "utf8");
    } catch {
      /* new file */
    }
    if (current !== body) writeFileSync(path, body);
  };

  const index: ContentIndex = { schema_version: 2, tracks: [] };
  for (const track of TRACKS) {
    const trackItems = items.filter((i) => i.track === track).sort(itemOrder);
    if (trackItems.length === 0) continue;
    const file: TrackFile = { track: track as Track, items: trackItems };
    output(`${track}.json`, JSON.stringify(file));
    index.tracks.push({
      id: track,
      title: TRACK_TITLES[track],
      count: trackItems.length,
      topics: [...new Set(trackItems.flatMap((i) => i.topics))].sort(),
      item_ids: trackItems.map((i) => i.id),
    });
  }
  output("index.json", JSON.stringify(index, null, 2));
  for (const name of readdirSync(OUT_DIR)) {
    if (!written.has(name)) rmSync(join(OUT_DIR, name), { recursive: true, force: true });
  }

  const summary = index.tracks.map((t) => `${t.id}: ${t.count}`).join(", ");
  console.log(`✓ content: ${items.length} items (${summary})`);
}

if (import.meta.filename === process.argv[1]) await main();
