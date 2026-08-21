#!/usr/bin/env node
/**
 * CLI entry point.
 *
 * @packageDocumentation
 */

import { buildFixture } from "./fixture/build.js";
import { generateFixture } from "./fixture/generate.js";

import type { FixtureOptions } from "./types.js";

const HELP = `
next-testing-toolkit — integration-testing harness for Next.js packages

Usage:
  next-testing-toolkit build-fixture --port <n> [options]

Options:
  --port <n>            Port the fixture serves on (required; one per package
                        so suites can run in parallel)
  --next <range>        Next.js version to install     (default: ^16)
  --react <range>       React version to install       (default: ^19)
  --layout-import <s>   Side-effect import to add to the fixture layout;
                        repeatable. Use it for a package's optional stylesheet
                        subpath, so the build fails if it stops resolving.
  -h, --help            Show this message
`;

/** Parses argv into fixture options. */
function parseArgs(argv: string[]): FixtureOptions {
  const layoutImports: string[] = [];
  let port: number | undefined;
  let nextVersion: string | undefined;
  let reactVersion: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case "--port":
        port = Number(value);
        i += 1;
        break;
      case "--next":
        nextVersion = value;
        i += 1;
        break;
      case "--react":
        reactVersion = value;
        i += 1;
        break;
      case "--layout-import":
        if (value) layoutImports.push(value);
        i += 1;
        break;
      default:
        break;
    }
  }

  if (!port || Number.isNaN(port)) {
    throw new Error("--port is required (e.g. --port 3210)");
  }

  return {
    port,
    ...(nextVersion ? { nextVersion } : {}),
    ...(reactVersion ? { reactVersion } : {}),
    ...(layoutImports.length ? { layoutImports } : {}),
  };
}

/** Dispatches the requested command. */
function main(): void {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "-h" || command === "--help") {
    console.log(HELP);
    return;
  }

  if (command !== "build-fixture") {
    console.error(`Unknown command: ${command}`);
    console.log(HELP);
    process.exitCode = 1;
    return;
  }

  const options = parseArgs(rest);
  const packageRoot = process.cwd();
  const fixture = generateFixture(packageRoot, options);
  buildFixture(fixture, options);
}

main();
