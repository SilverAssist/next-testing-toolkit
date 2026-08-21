/**
 * Playwright configuration factory for a package fixture.
 *
 * @packageDocumentation
 */

import type { PlaywrightTestConfig } from "@playwright/test";

/** Options for {@link definePackageFixtureConfig}. */
export interface FixtureConfigOptions {
  /** Port the fixture's production server listens on. */
  port: number;
  /** Directory holding the spec files, relative to the config. @defaultValue `"./specs"` */
  testDir?: string;
}

/**
 * Builds a Playwright config that serves the fixture's production build.
 *
 * `next start`, never `next dev`: Next's guidance is to test the production
 * build, "to more closely resemble how your application will behave". The
 * `webServer` block starts and stops it, so no `start-server-and-test`
 * dependency is needed.
 *
 * The base URL is `127.0.0.1` rather than `localhost` deliberately —
 * `localhost` can resolve to IPv6 while the server binds IPv4, which surfaces
 * as an unhelpful "This page couldn't load" in the browser while `curl`
 * succeeds.
 *
 * @param options - Fixture configuration.
 * @returns A Playwright config, ready to export.
 */
export function definePackageFixtureConfig(options: FixtureConfigOptions): PlaywrightTestConfig {
  const base = `http://127.0.0.1:${options.port}`;

  return {
    testDir: options.testDir ?? "./specs",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? "github" : "list",
    use: { baseURL: base, trace: "on-first-retry" },
    projects: [{ name: "chromium", use: { channel: "chromium" } }],
    webServer: {
      command: "npm --prefix fixture run start",
      url: base,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  };
}
