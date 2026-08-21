/**
 * Tests for the built-output assertions.
 *
 * Each case writes a real file to a temp dir and inspects it, rather than
 * stubbing `fs`: these helpers exist to read bundler output, so the thing worth
 * testing is what they conclude from actual bytes on disk.
 */

import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import { checkClientBoundary, checkNoClientBoundary } from "../assertions.ts";

let dir: string;

/** Writes `content` to a scratch file and returns its path. */
const file = (name: string, content: string): string => {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
};

/** Looks up a single check by name, failing loudly if it is missing. */
const byName = (checks: { name: string; ok: boolean }[], match: string) => {
  const found = checks.find((c) => c.name.includes(match));
  assert.ok(found, `no check matching ${JSON.stringify(match)}`);
  return found;
};

before(() => {
  dir = mkdtempSync(join(tmpdir(), "ntt-"));
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("checkClientBoundary", () => {
  it("passes for a correctly split build", () => {
    const clientEntry = file(
      "ok.client.js",
      '"use client";\nimport { useState } from "react";\nexport const C = () => useState(0);\n'
    );
    const rootEntry = file(
      "ok.index.js",
      'export { C } from "@scope/pkg/client";\nexport { verify } from "./server.js";\n'
    );

    const results = checkClientBoundary({
      clientEntry,
      rootEntry,
      clientSpecifier: "@scope/pkg/client",
    });

    assert.equal(results.length, 4);
    assert.ok(
      results.every((r) => r.ok),
      results
        .filter((r) => !r.ok)
        .map((r) => r.name)
        .join("; ")
    );
  });

  it("fails when the client entry lost its directive", () => {
    // consent-banner shipped exactly this for its entire published life:
    // tsup's treeshake pass silently dropped the esbuild banner.
    const clientEntry = file(
      "bare.client.js",
      'import { useState } from "react";\nexport const C = () => useState(0);\n'
    );

    const results = checkClientBoundary({ clientEntry });
    assert.equal(byName(results, "carries the").ok, false);
  });

  it("fails when the root inlines the client module", () => {
    // The recaptcha defect: dist/index.js contained the component itself, so
    // the directive -- a property of a *module* -- was flattened away.
    const clientEntry = file("in.client.js", '"use client";\nexport const C = 1;\n');
    const rootEntry = file(
      "in.index.js",
      'import { useRef } from "react";\nexport const C = () => useRef(null);\n'
    );

    const results = checkClientBoundary({ clientEntry, rootEntry });
    assert.equal(byName(results, "does not inline").ok, false);
  });

  it("fails when the root marks itself as client", () => {
    const clientEntry = file("m.client.js", '"use client";\nexport const C = 1;\n');
    const rootEntry = file("m.index.js", '"use client";\nexport { verify } from "./server.js";\n');

    const results = checkClientBoundary({ clientEntry, rootEntry });
    assert.equal(byName(results, "not itself marked").ok, false);
  });

  it("fails when the root does not re-export the expected specifier", () => {
    const clientEntry = file("s.client.js", '"use client";\nexport const C = 1;\n');
    const rootEntry = file("s.index.js", 'export { C } from "./elsewhere.js";\n');

    const results = checkClientBoundary({
      clientEntry,
      rootEntry,
      clientSpecifier: "@scope/pkg/client",
    });
    assert.equal(byName(results, "re-exports").ok, false);
  });

  it("skips the root rules when no root entry is given", () => {
    const clientEntry = file("only.client.js", '"use client";\nexport const C = 1;\n');
    assert.equal(checkClientBoundary({ clientEntry }).length, 1);
  });

  it("throws a build-shaped message for a missing file", () => {
    assert.throws(
      () => checkClientBoundary({ clientEntry: join(dir, "nope.js") }),
      /Run the build first/
    );
  });
});

describe("checkNoClientBoundary", () => {
  it("passes for pure server-renderable output", () => {
    const entry = file("icons.js", 'export const Icon = (p) => jsx("svg", p);\n');

    const results = checkNoClientBoundary([entry]);
    assert.equal(results.length, 2);
    assert.ok(results.every((r) => r.ok));
  });

  it("fails on a stray directive or hook", () => {
    const directived = file("d.js", '"use client";\nexport const A = 1;\n');
    const hooked = file("h.js", 'import { useEffect } from "react";\nuseEffect;\n');

    const results = checkNoClientBoundary([directived, hooked]);
    assert.equal(results.filter((r) => !r.ok).length, 2);
  });

  it("checks every entry it is given", () => {
    const a = file("a.js", "export const A = 1;\n");
    const b = file("b.js", "export const B = 2;\n");
    assert.equal(checkNoClientBoundary([a, b]).length, 4);
  });
});
