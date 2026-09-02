/**
 * Integration spec for @silverassist/next-testing-toolkit consumed by a real
 * Next app -- the harness dogfooding itself. The fixture installs the
 * *packed tarball*, so this proves both entry points in the `exports` map
 * ("." and "./assertions") actually resolve under a real Server Component
 * build, not just that `src/` imports work.
 */
import { expect, test } from "@playwright/test";

test("resolves the root and ./assertions entry points inside a Server Component build", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("next-testing-toolkit fixture");
  await expect(page.locator('[data-testid="base-url"]')).toHaveText("http://127.0.0.1:1");
  await expect(page.locator('[data-testid="assertions-fn"]')).toHaveText("function");
});

test("ships a non-empty ESLINT_IGNORE_PATTERNS array", async ({ page }) => {
  await page.goto("/");
  const count = Number(await page.locator('[data-testid="ignore-count"]').innerText());
  expect(count).toBeGreaterThan(0);
});
