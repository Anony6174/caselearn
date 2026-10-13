// Validates every item under content/ and bundles them into public/content/.
// Run with `npm run content` (also runs automatically before dev/build/test).
// Exits non-zero on any invalid item so a bad hand edit can't ship.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  ItemSchema, TRACKS, TRACK_TITLES,
  type ContentIndex, type Item, type Track, type TrackFile,
} from "../src/content/schema.ts";

const ROOT = join(import.meta.dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const OUT_DIR = join(ROOT, "public", "content");

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

function idOrder(a: Item, b: Item) {
  return a.id.localeCompare(b.id, "en", { numeric: true });
}

function main() {
  const { items, errors } = loadContent();
  if (errors.length > 0) {
    console.error(`✗ content: ${errors.length} problem(s)\n  ` + errors.join("\n  "));
    process.exit(1);
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const index: ContentIndex = { schema_version: 2, tracks: [] };
  for (const track of TRACKS) {
    const trackItems = items.filter((i) => i.track === track).sort(idOrder);
    if (trackItems.length === 0) continue;
    const file: TrackFile = { track: track as Track, items: trackItems };
    writeFileSync(join(OUT_DIR, `${track}.json`), JSON.stringify(file));
    index.tracks.push({
      id: track,
      title: TRACK_TITLES[track],
      count: trackItems.length,
      topics: [...new Set(trackItems.flatMap((i) => i.topics))].sort(),
    });
  }
  writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2));

  const summary = index.tracks.map((t) => `${t.id}: ${t.count}`).join(", ");
  console.log(`✓ content: ${items.length} items (${summary})`);
}

if (import.meta.filename === process.argv[1]) main();
