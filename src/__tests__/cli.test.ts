/**
 * Tests for CLI argument parsing.
 *
 * Imports from `cli-args.ts`, not `cli.ts` — the latter's runtime imports
 * only resolve once tsdown has bundled `dist/`, so it cannot be imported
 * directly under Node's native TypeScript stripping.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseArgs } from "../cli-args.ts";

describe("parseArgs", () => {
  it("requires --port", () => {
    assert.throws(() => parseArgs([]), /--port is required/);
  });

  it("rejects a non-numeric --port", () => {
    assert.throws(() => parseArgs(["--port", "abc"]), /--port is required/);
  });

  it("parses --port alone, leaving the optional fields undefined", () => {
    assert.deepEqual(parseArgs(["--port", "3210"]), { port: 3210 });
  });

  it("parses --next, --react and repeatable --layout-import", () => {
    const options = parseArgs([
      "--port",
      "3210",
      "--next",
      "^15",
      "--react",
      "^18",
      "--layout-import",
      "pkg/styles",
      "--layout-import",
      "pkg/theme",
    ]);

    assert.deepEqual(options, {
      port: 3210,
      nextVersion: "^15",
      reactVersion: "^18",
      layoutImports: ["pkg/styles", "pkg/theme"],
    });
  });

  it("ignores an unrecognized flag rather than failing", () => {
    assert.equal(parseArgs(["--port", "3210", "--bogus", "x"]).port, 3210);
  });
});
