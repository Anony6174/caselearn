/* Pyodide Web Worker — classic worker, loaded from CDN */
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodide = null;

/* ── bootstrap ──────────────────────────────────────────────────── */
async function initPyodide() {
  try {
    post("loading", "Booting Python environment…");

    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });

    // Redirect stdout/stderr back to main thread
    pyodide.setStdout({ batched: (t) => post("stdout", t) });
    pyodide.setStderr({ batched: (t) => post("stderr", t) });

    post("loading", "Loading numpy, pandas, scipy, scikit-learn, matplotlib…");
    await pyodide.loadPackage(["numpy", "pandas", "scipy", "scikit-learn", "matplotlib"]);

    // Pre-configure matplotlib Agg backend so figures can be captured
    pyodide.runPython(`
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import io, base64, sys
`);

    self.postMessage({ type: "ready" });
  } catch (err) {
    self.postMessage({ type: "error", text: String(err) });
  }
}

/* ── run user code ──────────────────────────────────────────────── */
async function runCode(code) {
  try {
    await pyodide.runPythonAsync(code);

    // Capture any open matplotlib figures as base64 PNGs
    const figCapture = pyodide.runPython(`
import matplotlib.pyplot as plt, io, base64 as _b64
_out = []
for _n in plt.get_fignums():
    _f = plt.figure(_n)
    _b = io.BytesIO()
    _f.savefig(_b, format="png", bbox_inches="tight", dpi=100)
    _b.seek(0)
    _out.append(_b64.b64encode(_b.read()).decode())
plt.close("all")
_out
`);

    const figs = figCapture.toJs ? figCapture.toJs() : Array.from(figCapture);
    figs.forEach((data) => self.postMessage({ type: "figure", data }));

    self.postMessage({ type: "done" });
  } catch (err) {
    // Extract just the Python traceback if present, otherwise JS message
    const text = err.message || String(err);
    post("stderr", text);
    self.postMessage({ type: "done" });
  }
}

/* ── message handler ────────────────────────────────────────────── */
self.onmessage = async (e) => {
  const { type, code } = e.data;
  if (type === "run") {
    await runCode(code);
  }
  // "init" is handled automatically on worker creation
};

/* ── helpers ────────────────────────────────────────────────────── */
function post(type, text) {
  self.postMessage({ type, text });
}

// Auto-init on worker creation
initPyodide();
