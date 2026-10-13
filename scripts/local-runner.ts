// A Vite plugin that lets the app run C++ and Bash challenges with the local
// toolchain, during `npm run dev` / `npm run preview` only (a static deploy
// has no such endpoint, and the app says so).
//
// It executes code on this machine, so it only accepts requests that come
// from the app's own page: a localhost Host header (blocks DNS rebinding), a
// matching same-origin Origin header (blocks other sites, which also can't
// send the custom header without a CORS preflight we never approve).

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import type { ProgramFiles } from "../src/runners/challenge.ts";
import { runProgram } from "./exec-program.ts";

export const RUN_HEADER = "x-caselearn-run";
const MAX_BODY = 512 * 1024;
const MAX_CONCURRENT = 2;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const FILE_NAME = /^[a-z0-9_-]+\.(py|cpp|sh)$/;

function hostname(hostHeader: string): string {
  return hostHeader.startsWith("[") ? hostHeader.slice(0, hostHeader.indexOf("]") + 1) : hostHeader.split(":")[0];
}

/** Whether a request may run code. Exported for tests. */
export function isTrustedRequest(headers: Record<string, string | string[] | undefined>): boolean {
  const host = headers.host;
  const origin = headers.origin;
  if (typeof host !== "string" || typeof origin !== "string") return false;
  if (headers[RUN_HEADER] !== "1") return false;
  if (!LOCAL_HOSTS.has(hostname(host))) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  return url.protocol === "http:" && url.host === host;
}

/** Validates the JSON body; returns an error message or the program. */
export function parseProgram(body: unknown): ProgramFiles | string {
  if (typeof body !== "object" || body === null) return "body must be a JSON object";
  const { language, files } = body as Record<string, unknown>;
  if (language !== "python" && language !== "cpp" && language !== "bash") return "unknown language";
  if (typeof files !== "object" || files === null) return "files must be an object";
  const entries = Object.entries(files);
  if (entries.length === 0 || entries.length > 4) return "between 1 and 4 files";
  for (const [name, content] of entries) {
    if (!FILE_NAME.test(name)) return `bad file name: ${name}`;
    if (typeof content !== "string") return `file ${name} must be a string`;
  }
  return { language, files: files as Record<string, string> };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("request too large"));
        req.destroy();
      } else {
        chunks.push(c);
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

let running = 0;

const handler: Connect.NextHandleFunction = async (req, res, next) => {
  const path = req.url?.split("?")[0];
  if (path === "/api/health") {
    // Lets the app tell "local mode" from a static deploy. Safe: runs nothing.
    return send(res, 200, { ok: true, languages: ["python", "cpp", "bash"] });
  }
  if (path !== "/api/run") return next();
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!isTrustedRequest(req.headers)) return send(res, 403, { error: "untrusted origin" });
  if (running >= MAX_CONCURRENT) return send(res, 429, { error: "busy, try again" });

  running++;
  try {
    let body: unknown;
    try {
      body = JSON.parse(await readBody(req));
    } catch (e) {
      return send(res, 400, { error: (e as Error).message });
    }
    const program = parseProgram(body);
    if (typeof program === "string") return send(res, 400, { error: program });
    send(res, 200, await runProgram(program));
  } catch (e) {
    send(res, 500, { error: (e as Error).message });
  } finally {
    running--;
  }
};

export function localRunner(): Plugin {
  return {
    name: "caselearn-local-runner",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
