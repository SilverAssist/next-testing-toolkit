/**
 * Glob patterns every consuming repo must exclude from linting and formatting.
 *
 * The fixture installs the packed tarball into its own `node_modules` and
 * builds there. Without these, `eslint .` walks into third-party code — it
 * reported 3670 errors the first time a repo with ESLint adopted the harness.
 *
 * Build output is here too. Every consumer of this package is itself a
 * published package with a `dist/`, and linting bundled CJS output produces
 * only noise (`'require' is not defined`, `'exports' is not defined`) — this
 * package's own repo hit exactly that before adding it.
 *
 * @packageDocumentation
 */

/** Patterns for ESLint's flat-config `ignores`. */
export const ESLINT_IGNORE_PATTERNS: readonly string[] = [
  "dist/**",
  "coverage/**",
  "e2e/fixture/node_modules/**",
  "e2e/fixture/.next/**",
];

/** Patterns for `.prettierignore` and `.gitignore`. */
export const IGNORE_PATHS: readonly string[] = [
  "dist",
  "coverage",
  "e2e/fixture/node_modules",
  "e2e/fixture/.next",
  "e2e/fixture/package-lock.json",
  "test-results",
  "playwright-report",
];
