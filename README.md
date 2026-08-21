# @silverassist/next-testing-toolkit

Integration-testing harness for npm packages that Next.js apps consume. It builds a
throwaway Next app around the **packed tarball**, so the thing under test is what npm
would actually publish.

> **Not a unit-test replacement.** This catches the defects that live in `dist/` and
> `package.json` — the ones a test importing from `src/` is structurally blind to.

## Why it exists

Four defects reached npm undetected before this harness existed. None was visible to a
unit test:

| Package               | Defect                                                                         | Only visible when                           |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| `consent-banner`      | Shipped with **no `"use client"` at all**, for its entire published life       | a Server Component imports the _built_ file |
| `performance-toolkit` | `exports` pointed all 8 subpaths at `.mjs` files the build never produced      | Node resolves the _published tarball_       |
| `recaptcha`           | Root barrel threw in Server Components — the bundler inlined the client module | a Server Component imports it               |
| `recaptcha` in an app | Token never reached the Server Action                                          | a real form submission                      |

Three of the four are **packaging** defects, and three of the four are caught by
`next build` alone — no browser needed.

## Install

```bash
npm install -D @silverassist/next-testing-toolkit @playwright/test
npx playwright install chromium
```

Requires Node >= 22.

## Quick start

Three files per package. Everything else is generated.

**1. `package.json`** — one script, and a port unique to this package:

```json
{
  "scripts": {
    "e2e:setup": "next-testing-toolkit build-fixture --port 3212",
    "e2e": "npm run e2e:setup && playwright test -c e2e/playwright.config.ts"
  }
}
```

**2. `e2e/playwright.config.ts`**:

```typescript
import { definePackageFixtureConfig } from "@silverassist/next-testing-toolkit";

export default definePackageFixtureConfig({ port: 3212 });
```

**3. `e2e/fixture/app/page.tsx`** — the only genuinely package-specific file. It must be
a **Server Component** (no `"use client"`), because that is what turns a missing
directive in your package into a build failure rather than a silent break in someone
else's app:

```tsx
import { MyComponent } from "@scope/my-package";

export default function Page() {
  return <MyComponent />;
}
```

Then `npm run e2e`. The harness builds your package, runs `npm pack`, installs the
tarball into the fixture, runs `next build`, starts the production server and runs your
specs against it.

## What `build-fixture` does

```text
npm run build              → your package's own build
npm pack                   → the exact tarball npm publishes
generate fixture app       → package.json, next.config.mjs, layout.tsx
npm install ./pkg.tgz      → into the fixture
next build                 → catches packaging + RSC-boundary defects
```

**Installing the packed tarball is the whole point.** Not `src/`, not a workspace link,
not `file:../` — only `npm pack` output exercises `files`, `exports` and the built
artifact together.

Your `e2e/fixture/app/page.tsx` is preserved across runs; everything else in the fixture
is regenerated and should be git-ignored.

### Options

| Flag                  | Default      | Purpose                                                    |
| --------------------- | ------------ | ---------------------------------------------------------- |
| `--port <n>`          | _(required)_ | One per package, so suites can run in parallel             |
| `--next <range>`      | `^16`        | Next version to install into the fixture                   |
| `--react <range>`     | `^19`        | React version to install                                   |
| `--layout-import <s>` | —            | Side-effect import added to the fixture layout; repeatable |

`--layout-import` is how a stylesheet subpath gets covered — the fixture build fails if
`@scope/pkg/styles` stops resolving, which is how a `./styles` export pointing at a file
the build never emitted gets caught:

```bash
next-testing-toolkit build-fixture --port 3213 --layout-import @scope/pkg/styles
```

## Built-output assertions

Framework-agnostic checks over `dist/`. Each returns results rather than throwing, so
the same helpers work under Jest, Vitest or `node:test`.

```typescript
import { checkClientBoundary } from "@silverassist/next-testing-toolkit/assertions";

for (const check of checkClientBoundary({
  clientEntry: "dist/client.js",
  rootEntry: "dist/index.js",
  clientSpecifier: "@scope/pkg/client",
})) {
  it(check.name, () => expect(check.ok).toBe(true));
}
```

`checkClientBoundary` encodes one rule:

> **A barrel may re-export across the RSC boundary. A bundle may not inline across it.**

`"use client"` is a property of a _module_. When a bundler inlines the client module into
the root barrel, the directive is flattened away and the component throws in a Server
Component — while every source-level test still passes. The checks assert that the client
entry carries the directive, that the root does **not** (marking a root that also
re-exports server code would ship secret handling to the browser), and that the root
re-exports rather than inlines.

`checkNoClientBoundary(entries)` is the inverse contract, for packages of pure
server-renderable components such as an icon set: one stray hook silently converts every
component into a client component and starts shipping JavaScript for static markup.

## Ignore patterns

The fixture installs a tarball into its own `node_modules`. Without excluding it,
`eslint .` walks into third-party code — 3670 errors, the first time a repo with ESLint
adopted this harness.

```javascript
// eslint.config.mjs
import { ESLINT_IGNORE_PATTERNS } from "@silverassist/next-testing-toolkit";

export default [{ ignores: [...ESLINT_IGNORE_PATTERNS] } /* … */];
```

`IGNORE_PATHS` is the plain-path equivalent for `.gitignore` and `.prettierignore`.

## Notes

**Stub third-party scripts.** A spec that reaches `google.com` is flaky in CI and tests
Google, not your package. What matters is your package's own wiring: does it request the
right URL, and does the value reach the element a Server Action reads?

**Playwright, not Cypress.** The org standardises on Cypress for Next **apps**; packages
share no specs, helpers or fixtures with those repos, so the consistency argument does not
reach them. Playwright's `webServer` starts and stops the fixture itself, removing the
`start-server-and-test` dependency the Cypress path needs.

**Pair it with packaging checks** — cheap, and they find real defects:

| Tool                    | Catches                                         |
| ----------------------- | ----------------------------------------------- |
| `npm publish --dry-run` | what actually ships, before it ships            |
| `publint`               | malformed `exports`, wrong fields, broken paths |
| `@arethetypeswrong/cli` | types unresolvable per module-resolution mode   |

## License

[PolyForm Noncommercial 1.0.0](./LICENSE)
