/**
 * Case-study sandbox code keeps its key computation lines commented out under
 * a "# Try it yourself:" header, so the structure is visible. This uncomments
 * them so the code runs out of the box, but leaves plain-English instructions
 * ("Then sweep the thresholds…") as comments. Shared by the app and by the
 * build, which checks that the result is valid Python.
 */
export function makeRunnable(raw: string): string {
  let pastMarker = false;
  let inSentence = false; // a prose sentence wrapped over several comment lines
  return raw
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# Try it yourself") && trimmed.endsWith(":")) {
        pastMarker = true;
        return "# ── Try it yourself ──────────────────────────────";
      }
      if (!pastMarker || !line.startsWith("# ")) {
        inSentence = false;
        return line;
      }
      const text = line.slice(2);
      if (inSentence || looksLikeProse(text)) {
        inSentence = !/[.!?:]\s*$/.test(text);
        return line;
      }
      return text;
    })
    .join("\n");
}

// A sentence: starts with a capitalised word followed by a lowercase word, and
// has none of the characters an assignment or call would need.
function looksLikeProse(text: string): boolean {
  return /^[A-Z][a-z']*\s+[a-z]/.test(text) && !/[=()[\]]/.test(text);
}
