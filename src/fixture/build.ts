/**
 * Packs the consuming package and builds the fixture against that tarball.
 *
 * Packing is the whole point. The fixture must consume the exact artifact npm
 * publishes -- not `src/`, not a workspace link. Three defects across this
 * package family were invisible any other way: a missing "use client"
 * directive, an `exports` map pointing at files the build never produced, and
 * a documented stylesheet subpath that resolved to nothing.
 *
 * @packageDocumentation
 */

import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

import type { FixtureOptions, ResolvedFixture } from "../types.js";

/** Runs a command, streaming output, and fails loudly. */
function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

/**
 * Builds the package, packs it, installs the tarball into the fixture, and
 * runs `next build`.
 *
 * That last step is the cheap, high-value gate: it catches both the
 * client-boundary and the packaging classes of defect without a browser.
 *
 * @param fixture - The generated fixture.
 * @param options - Fixture configuration.
 */
export function buildFixture(fixture: ResolvedFixture, options: FixtureOptions): void {
  const { packageRoot, fixtureDir } = fixture;

  console.log("→ Building the package");
  run("npm", ["run", "build"], packageRoot);

  console.log("→ Packing");
  // `npm pack --json` shape differs across npm majors: an array of manifests
  // up to npm 11, an object keyed by package name from npm 12. Normalize.
  const packed = JSON.parse(
    run("npm", ["pack", "--json", "--ignore-scripts"], packageRoot)
  ) as unknown;
  const manifest = (Array.isArray(packed) ? packed[0] : Object.values(packed as object)[0]) as
    { filename?: string } | undefined;

  if (!manifest?.filename) {
    throw new Error("Could not read a filename from `npm pack --json`");
  }
  const tarball = join(packageRoot, manifest.filename);

  console.log(`→ Installing ${manifest.filename} into the fixture`);
  // A stale install would silently test the previous build.
  for (const stale of ["node_modules", ".next", "package-lock.json"]) {
    rmSync(join(fixtureDir, stale), { recursive: true, force: true });
  }

  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      `next@${options.nextVersion ?? "^16"}`,
      `react@${options.reactVersion ?? "^19"}`,
      `react-dom@${options.reactVersion ?? "^19"}`,
      // TypeScript is installed *in the fixture* deliberately. Without it Node
      // resolution walks up and finds the package's own copy, which Next may
      // reject outright -- Next 15 refuses TypeScript 7 ("the native compiler
      // does not provide the JavaScript compiler API that Next.js requires").
      "typescript@^5",
      "@types/react@^19",
      tarball,
    ],
    fixtureDir
  );

  console.log("→ next build");
  run("npm", ["run", "build"], fixtureDir);

  rmSync(tarball, { force: true });
  console.log("✅ Fixture built against the packed tarball");
}
