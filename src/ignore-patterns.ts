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
 * The fixture's *generated* files are excluded for a different reason: this
 * package writes them, but each consumer lints them against its own Prettier
 * config, so any formatting choice made here fails somewhere. `app/page.tsx`
 * is deliberately NOT excluded — that one is hand-written per package and is
 * the file most worth linting.
 *
 * @packageDocumentation
 */

/** Patterns for ESLint's flat-config `ignores`. */
export const ESLINT_IGNORE_PATTERNS: readonly string[] = [
  "dist/**",
  "coverage/**",
  "e2e/fixture/node_modules/**",
  "e2e/fixture/.next/**",
  "e2e/fixture/app/layout.tsx",
  "e2e/fixture/next.config.mjs",
  "e2e/fixture/next-env.d.ts",
  "e2e/fixture/tsconfig.json",
  "e2e/fixture/package.json",
];

/** Patterns for `.prettierignore` and `.gitignore`. */
export const IGNORE_PATHS: readonly string[] = [
  "dist",
  "coverage",
  "e2e/fixture/node_modules",
  "e2e/fixture/.next",
  "e2e/fixture/package-lock.json",
  "e2e/fixture/app/layout.tsx",
  "e2e/fixture/next.config.mjs",
  "e2e/fixture/next-env.d.ts",
  "e2e/fixture/tsconfig.json",
  "e2e/fixture/package.json",
  "test-results",
  "playwright-report",
];
