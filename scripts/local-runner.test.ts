import { describe, expect, it } from "vitest";
import { RUN_HEADER, isTrustedRequest, parseProgram } from "./local-runner.ts";

const ok = { host: "localhost:5173", origin: "http://localhost:5173", [RUN_HEADER]: "1" };

describe("isTrustedRequest", () => {
  it("accepts the app's own page", () => {
    expect(isTrustedRequest(ok)).toBe(true);
    expect(isTrustedRequest({ ...ok, host: "127.0.0.1:4173", origin: "http://127.0.0.1:4173" })).toBe(true);
    expect(isTrustedRequest({ ...ok, host: "[::1]:5173", origin: "http://[::1]:5173" })).toBe(true);
  });

  it("rejects other sites", () => {
    expect(isTrustedRequest({ ...ok, origin: "https://evil.example" })).toBe(false);
    expect(isTrustedRequest({ ...ok, origin: "http://localhost:3000" })).toBe(false); // another local app
  });

  it("rejects DNS rebinding (non-local Host)", () => {
    expect(isTrustedRequest({ ...ok, host: "evil.example:5173", origin: "http://evil.example:5173" })).toBe(false);
  });

  it("requires the custom header and an Origin", () => {
    expect(isTrustedRequest({ host: ok.host, origin: ok.origin })).toBe(false);
    expect(isTrustedRequest({ host: ok.host, [RUN_HEADER]: "1" })).toBe(false);
  });
});

describe("parseProgram", () => {
  it("accepts a valid program", () => {
    expect(parseProgram({ language: "bash", files: { "main.sh": "echo hi", "solution.sh": "" } })).toEqual({
      language: "bash",
      files: { "main.sh": "echo hi", "solution.sh": "" },
    });
  });

  it("rejects bad languages and path-traversal file names", () => {
    expect(parseProgram({ language: "ruby", files: { "main.rb": "" } })).toBe("unknown language");
    expect(parseProgram({ language: "bash", files: { "../x.sh": "" } })).toMatch(/bad file name/);
    expect(parseProgram({ language: "bash", files: { "main.sh": 1 } })).toMatch(/must be a string/);
  });
});
