import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentOnInput, bracketMatching, foldGutter, indentUnit, StreamLanguage, type StreamParser } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { editorTheme } from "./editorTheme";
import { useCodePanel } from "../items/codePanel";

interface Props {
  code: string;
  onChange?: (code: string) => void;
  language?: "python" | "cpp" | "bash";
  disabled?: boolean;
  /** Display-only: not editable and sized to fit the code. */
  readOnly?: boolean;
}

// legacy-modes declares its own copy of StringStream, which TypeScript sees as a
// different type (private fields); at runtime they're interchangeable.
const shellParser = shell as unknown as StreamParser<unknown>;
const languages = { python, cpp, bash: () => StreamLanguage.define(shellParser) };

export function CodeEditor({ code, onChange, language = "python", disabled = false, readOnly = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableRef = useRef(new Compartment());
  const { expanded } = useCodePanel();

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange?.(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        readOnly ? [] : highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        readOnly ? [] : autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        readOnly ? [] : foldGutter(),
        indentUnit.of(language === "python" ? "    " : "  "),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        languages[language](),
        editorTheme,
        updateListener,
        EditorState.readOnly.of(readOnly),
        editableRef.current.of(EditorView.editable.of(!readOnly && !disabled)),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only recreate on mount/unmount; onChange handled via ref closure updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replace the document when the `code` prop changes from outside (e.g. a
  // Reset button). Edits made in the editor already match, so they're no-ops.
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== code) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
    }
  }, [code]);

  // Keep disabled state in sync without recreating
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: editableRef.current.reconfigure(EditorView.editable.of(!readOnly && !disabled)),
    });
  }, [disabled, readOnly]);

  // Editable editors get a drag handle (resize-y); "Expand code" raises the limits.
  const size = readOnly
    ? expanded ? "max-h-[calc(100vh-11rem)]" : "max-h-[70vh]"
    : expanded ? "min-h-[440px] max-h-[calc(100vh-12rem)] resize-y" : "min-h-[260px] max-h-[80vh] resize-y";
  return (
    <div
      ref={containerRef}
      className={`${size} flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-code-bg)]`}
      style={{ fontVariantLigatures: "none" }}
      title={readOnly ? undefined : "Drag the bottom-right corner to resize"}
    />
  );
}
