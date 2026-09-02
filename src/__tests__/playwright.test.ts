/**
 * Tests for the generated Playwright config.
 *
 * Every downstream consumer's `e2e/playwright.config.ts` is a one-line
 * re-export of this factory's return value, so a regression here breaks the
 * fixture's `webServer` wiring for all of them at once.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { definePackageFixtureConfig } from "../playwright.ts";

import type { PlaywrightTestConfig } from "@playwright/test";

/** Reads `webServer` back out as a plain record, since it may be an array in the type. */
const webServer = (config: PlaywrightTestConfig): { url?: string; reuseExistingServer?: boolean } =>
  config.webServer as { url?: string; reuseExistingServer?: boolean };

describe("definePackageFixtureConfig", () => {
  it("builds a 127.0.0.1 baseURL from the port, not localhost", () => {
    const config = definePackageFixtureConfig({ port: 3210 });

    assert.equal(config.use?.baseURL, "http://127.0.0.1:3210");
    assert.equal(webServer(config).url, "http://127.0.0.1:3210");
  });

  it("defaults testDir to ./specs and honors an override", () => {
    assert.equal(definePackageFixtureConfig({ port: 1 }).testDir, "./specs");
    assert.equal(definePackageFixtureConfig({ port: 1, testDir: "./e2e" }).testDir, "./e2e");
  });

  it("reuses an existing server outside CI, and never inside it", () => {
    const original = process.env.CI;
    try {
      delete process.env.CI;
      assert.equal(webServer(definePackageFixtureConfig({ port: 1 })).reuseExistingServer, true);

      process.env.CI = "true";
      assert.equal(webServer(definePackageFixtureConfig({ port: 1 })).reuseExistingServer, false);
    } finally {
      if (original === undefined) delete process.env.CI;
      else process.env.CI = original;
    }
  });

  it("restricts projects to chromium only", () => {
    const config = definePackageFixtureConfig({ port: 1 });

    assert.equal(config.projects?.length, 1);
    assert.equal(config.projects?.[0]?.name, "chromium");
  });
});
