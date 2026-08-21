/**
 * Integration-testing harness for npm packages consumed by Next.js apps.
 *
 * @packageDocumentation
 */

export { buildFixture } from "./fixture/build.js";
export { generateFixture } from "./fixture/generate.js";
export { definePackageFixtureConfig } from "./playwright.js";
export { ESLINT_IGNORE_PATTERNS, IGNORE_PATHS } from "./ignore-patterns.js";

export type { FixtureConfigOptions } from "./playwright.js";
export type { FixtureOptions, ResolvedFixture } from "./types.js";
