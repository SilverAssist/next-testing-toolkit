# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-21

First release. Extracts the integration-testing setup validated across
`@silverassist/recaptcha`, `@silverassist/consent-banner` and `@silverassist/icons`
into a reusable harness.

### Added

- **Fixture harness** — `generateFixture()` and `buildFixture()` build a throwaway Next.js
  app around the consumer's **packed tarball**, then run `next build` against it. Installing
  `npm pack` output rather than `src/`, a workspace link or `file:../` is what makes
  packaging defects visible: it is the only thing that exercises `files`, `exports` and the
  built artifact together.
- **`next-testing-toolkit build-fixture` CLI** — `--port` (required, one per package so
  suites run in parallel), `--next`, `--react`, and a repeatable `--layout-import` for
  covering optional subpaths such as a package's stylesheet.
- **Built-output assertions** (`./assertions` subpath) — `checkClientBoundary()` and
  `checkNoClientBoundary()`, encoding the rule _a barrel may re-export across the RSC
  boundary, but a bundle may not inline across it_. Framework-agnostic: each returns
  results rather than throwing, so they work under Jest, Vitest or `node:test`.
- **`definePackageFixtureConfig()`** — a Playwright config serving the production build via
  `webServer`, removing the `start-server-and-test` dependency. Binds `127.0.0.1` rather
  than `localhost`, which can resolve to IPv6 while the server binds IPv4.
- **`ESLINT_IGNORE_PATTERNS` / `IGNORE_PATHS`** — globs consuming repos must exclude from
  linting and formatting. Without them `eslint .` walks into the fixture's `node_modules`;
  it reported 3670 errors the first time a repo with ESLint adopted the harness.

### Notes

- Ships **dual CJS and ESM**. The Playwright config factory is imported from
  `playwright.config.ts`, which is CJS in any consumer that does not declare
  `"type": "module"` — an ESM-only build made that config unloadable.
- Published with **npm trusted publishing (OIDC)**; no npm token exists in this repo.

[0.1.0]: https://github.com/SilverAssist/next-testing-toolkit/releases/tag/v0.1.0
