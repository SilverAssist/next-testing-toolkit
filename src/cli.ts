#!/usr/bin/env node
/**
 * CLI entry point.
 *
 * @packageDocumentation
 */

import { pathToFileURL } from "node:url";

import { HELP, parseArgs } from "./cli-args.js";
import { buildFixture } from "./fixture/build.js";
import { generateFixture } from "./fixture/generate.js";

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

// Guarded so importing this module does not also run the CLI against the
// importing process's own argv -- irrelevant for the published binary
// (always invoked directly), but this file is a `.js`-import graph away from
// `parseArgs`, so nothing here needs to run under `node --test`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
