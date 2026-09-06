import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentUnit } from "@codemirror/language";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

interface Props {
  code: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function CodeEditor({ code, onChange, disabled = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        foldGutter(),
        indentUnit.of("    "),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        python(),
        oneDark,
        updateListener,
        EditorView.theme({
          "&": {
            fontSize: "13px",
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            backgroundColor: "#0d0d14",
            borderRadius: "0.75rem",
            height: "100%",
          },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { padding: "12px 0" },
          ".cm-gutters": { backgroundColor: "#0d0d14", borderRight: "1px solid #2a2a3d" },
        }),
        EditorView.editable.of(!disabled),
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
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: [],
    });
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      className="min-h-[260px] max-h-[480px] overflow-auto rounded-xl border border-[var(--color-border)]"
      style={{ fontVariantLigatures: "none" }}
    />
  );
}
