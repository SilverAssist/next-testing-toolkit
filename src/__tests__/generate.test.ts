/**
 * Tests for fixture scaffolding.
 *
 * Each case writes a real `package.json` to a temp dir and inspects the
 * generated fixture files, rather than stubbing `fs`: this is the exact
 * file-writing every downstream consumer's `e2e:setup` depends on.
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import { generateFixture } from "../fixture/generate.ts";

let dir: string;

before(() => {
  dir = mkdtempSync(join(tmpdir(), "ntt-generate-"));
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Writes a scratch package root with the given `package.json` manifest. */
const packageRoot = (name: string, manifest: Record<string, unknown>): string => {
  const root = join(dir, name);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify(manifest));
  return root;
};

describe("generateFixture", () => {
  it("derives the fixture's own package name from the consumer's, stripping its scope", () => {
    const root = packageRoot("scoped", { name: "@scope/my-pkg" });

    const fixture = generateFixture(root, { port: 4000 });

    assert.equal(fixture.packageName, "@scope/my-pkg");
    assert.equal(fixture.port, 4000);
    const fixturePkg = JSON.parse(readFileSync(join(fixture.fixtureDir, "package.json"), "utf8"));
    assert.equal(fixturePkg.name, "my-pkg-e2e-fixture");
    assert.equal(fixturePkg.scripts.start, "next start -p 4000");
  });

  it("pins outputFileTracingRoot and disables build-time type errors", () => {
    const root = packageRoot("config", { name: "pkg" });

    const fixture = generateFixture(root, { port: 4001 });
    const config = readFileSync(join(fixture.fixtureDir, "next.config.mjs"), "utf8");

    assert.match(config, /outputFileTracingRoot: here/);
    assert.match(config, /ignoreBuildErrors: true/);
  });

  it("adds a side-effect import per layoutImports entry", () => {
    const root = packageRoot("with-imports", { name: "pkg" });

    const fixture = generateFixture(root, { port: 4002, layoutImports: ["pkg/styles"] });
    const layout = readFileSync(join(fixture.fixtureDir, "app", "layout.tsx"), "utf8");

    assert.match(layout, /^import "pkg\/styles";/);
  });

  it("writes no import line when layoutImports is omitted", () => {
    const root = packageRoot("without-imports", { name: "pkg" });

    const fixture = generateFixture(root, { port: 4003 });
    const layout = readFileSync(join(fixture.fixtureDir, "app", "layout.tsx"), "utf8");

    assert.doesNotMatch(layout, /^import /);
  });

  it("throws when the consuming package has no name", () => {
    const root = packageRoot("unnamed", {});

    assert.throws(() => generateFixture(root, { port: 4004 }), /No "name" in/);
  });
});
