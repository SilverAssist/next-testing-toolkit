// This package's own e2e config imports from source, not from
// "@silverassist/next-testing-toolkit" -- unlike every downstream consumer,
// this repo *is* that package, and the fixture's `page.tsx` below is what
// proves the published entry points resolve. This file is orchestration, not
// the thing under test.
import { definePackageFixtureConfig } from "../src/playwright.ts";

export default definePackageFixtureConfig({ port: 3220 });
