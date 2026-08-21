/**
 * Fixture generation.
 *
 * Everything here is derived from the consuming package's own `package.json`,
 * except the port. That is the finding that justified this package: comparing
 * three hand-written implementations, the install script differed by one line,
 * the Next config by a comment, and the tsconfig only by formatting.
 *
 * @packageDocumentation
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { FixtureOptions, ResolvedFixture } from "../types.js";

/** Reads the consuming package's name from its manifest. */
function readPackageName(packageRoot: string): string {
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
    name?: string;
  };

  if (!manifest.name) {
    throw new Error(`No "name" in ${join(packageRoot, "package.json")}`);
  }
  return manifest.name;
}

/**
 * Writes the fixture app's scaffolding.
 *
 * Note what is *not* written: `tsconfig.json`. Next generates it on first
 * build, and the three hand-written copies differed only in formatting — so
 * committing one adds a file that drifts without ever carrying information.
 *
 * @param packageRoot - Absolute path to the consuming package.
 * @param options - Fixture configuration.
 * @returns Resolved paths and metadata for the generated fixture.
 */
export function generateFixture(packageRoot: string, options: FixtureOptions): ResolvedFixture {
  const packageName = readPackageName(packageRoot);
  const fixtureDir = join(packageRoot, "e2e", "fixture");
  const appDir = join(fixtureDir, "app");
  mkdirSync(appDir, { recursive: true });

  writeFileSync(
    join(fixtureDir, "package.json"),
    JSON.stringify(
      {
        name: `${packageName.replace(/^@[^/]+\//, "")}-e2e-fixture`,
        private: true,
        version: "0.0.0",
        scripts: {
          build: "next build",
          start: `next start -p ${options.port}`,
        },
      },
      null,
      2
    ) + "\n"
  );

  writeFileSync(
    join(fixtureDir, "next.config.mjs"),
    `import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  // The fixture lives inside the package repo, so Next finds two lockfiles and
  // guesses the wrong workspace root. Pin it to the fixture.
  outputFileTracingRoot: here,
  // Type errors are the package's own CI concern; this build exists to prove
  // the packed tarball resolves and renders.
  typescript: { ignoreBuildErrors: true },
};
`
  );

  const imports = (options.layoutImports ?? [])
    .map((specifier) => `import ${JSON.stringify(specifier)};\n`)
    .join("");

  writeFileSync(
    join(appDir, "layout.tsx"),
    `${imports}${imports ? "\n" : ""}export const metadata = { title: ${JSON.stringify(
      `${packageName} e2e fixture`
    )} };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
  );

  return { packageRoot, fixtureDir, packageName, port: options.port };
}
