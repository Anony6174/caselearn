import { createContext, useContext } from "react";

// Whether the code panel beside a question is expanded (wider column, taller
// editor). Provided by ItemPage; read by Split and CodeEditor. Remembered
// across items and visits.

export interface CodePanel {
  expanded: boolean;
  toggle: () => void;
}

export const CodePanelContext = createContext<CodePanel>({ expanded: false, toggle: () => {} });

export const useCodePanel = () => useContext(CodePanelContext);

const KEY = "caselearn_code_expanded";

export function loadExpanded(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function saveExpanded(expanded: boolean) {
  try {
    localStorage.setItem(KEY, expanded ? "1" : "0");
  } catch {
    /* a preference only; ignore storage errors */
  }
}
