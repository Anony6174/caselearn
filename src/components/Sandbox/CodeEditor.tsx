import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentOnInput, bracketMatching, foldGutter, indentUnit } from "@codemirror/language";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { editorTheme } from "./editorTheme";

interface Props {
  code: string;
  onChange?: (code: string) => void;
  language?: "python" | "cpp";
  disabled?: boolean;
  /** Display-only: not editable and sized to fit the code. */
  readOnly?: boolean;
}

const languages = { python, cpp };

export function CodeEditor({ code, onChange, language = "python", disabled = false, readOnly = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableRef = useRef(new Compartment());

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
        indentUnit.of("    "),
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

  // Keep disabled state in sync without recreating
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: editableRef.current.reconfigure(EditorView.editable.of(!readOnly && !disabled)),
    });
  }, [disabled, readOnly]);

  return (
    <div
      ref={containerRef}
      className={`${readOnly ? "max-h-[70vh]" : "min-h-[220px] max-h-[420px]"} overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-code-bg)]`}
      style={{ fontVariantLigatures: "none" }}
    />
  );
}
