import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Built from the CSS variables in index.css, so the editor follows the
// light/dark theme without being recreated.

const chrome = EditorView.theme({
  "&": {
    fontSize: "13px",
    color: "var(--color-text)",
    backgroundColor: "var(--color-code-bg)",
    // Fill the (flex) container, so a taller panel means more editing room,
    // and scroll inside it.
    flex: "1 1 auto",
    minHeight: "0",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono)", lineHeight: "1.65" },
  ".cm-content": { padding: "14px 0", caretColor: "var(--color-text)" },
  ".cm-line": { padding: "0 16px 0 6px" },
  ".cm-gutters": {
    backgroundColor: "var(--color-code-bg)",
    color: "var(--color-text-faint)",
    border: "none",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 4px 0 14px", minWidth: "2.2em" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--color-text-muted)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-text)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--color-accent) 22%, transparent) !important",
  },
  ".cm-matchingBracket": {
    backgroundColor: "color-mix(in srgb, var(--color-accent) 16%, transparent)",
    outline: "none",
  },
  ".cm-foldGutter .cm-gutterElement": { color: "var(--color-text-faint)" },
  ".cm-tooltip": {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    color: "var(--color-text)",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--color-accent-soft)",
    color: "var(--color-text)",
  },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword, t.modifier], color: "var(--syn-keyword)" },
  { tag: [t.string, t.special(t.string), t.character], color: "var(--syn-string)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--syn-number)" },
  { tag: [t.comment, t.lineComment, t.blockComment, t.meta], color: "var(--syn-comment)", fontStyle: "italic" },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: "var(--syn-type)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: "var(--syn-function)" },
  { tag: [t.processingInstruction, t.escape], color: "var(--syn-keyword)" },
  { tag: [t.operator, t.punctuation, t.bracket], color: "var(--color-text-muted)" },
  { tag: t.invalid, color: "var(--color-bad)" },
]);

export const editorTheme = [chrome, syntaxHighlighting(highlight)];
