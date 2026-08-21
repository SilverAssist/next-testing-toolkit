# Contributing

## What this package is

A testing harness for **other** packages. It generates a Next.js fixture app, installs the
consumer's packed tarball into it, and builds it — so the defects it catches live in
`dist/` and `package.json`, not in anyone's `src/`.

That shapes every decision here: **the fixture must consume the tarball**, never a
workspace link or a relative path. A change that makes the harness resolve source files
instead defeats the package's only purpose.

## Setup

```bash
npm ci
npm run check   # format:check → typecheck → lint → build → test
```

Requires Node >= 22.18 — the test suite runs `.ts` files through Node's native type
stripping, which is only enabled by default from that version.

## Layout

```text
src/
├── assertions.ts        # built-output checks (the ./assertions subpath)
├── cli.ts               # the `next-testing-toolkit` bin
├── fixture/
│   ├── generate.ts      # writes the fixture app
│   └── build.ts         # build → pack → install → next build
├── ignore-patterns.ts   # globs consuming repos must exclude from lint/format
├── index.ts             # root barrel (the "." entry point)
├── playwright.ts        # definePackageFixtureConfig
├── types.ts             # shared types
└── __tests__/           # node:test suites
```

## Testing

`node:test`, with **zero test dependencies**. Deliberate: this is an ESM-only Node CLI,
not a React package, so the org's Jest+SWC setup buys nothing here and Jest's ESM support
would cost real configuration. The org's Playwright-over-Cypress reasoning applies the
same way — packages are not apps.

Assertions write real files to a temp dir rather than stubbing `fs`. These helpers exist
to read bundler output, so what is worth testing is what they conclude from actual bytes.

## Conventions

- **TSDoc** on every exported symbol, with `@param` / `@returns`.
- **Explicit types** — no `any`.
- Comments explain _why_, and are worth writing when a line encodes a defect someone
  already shipped. Several here name the exact package and failure they came from; keep
  that when editing near them.
- `src/` uses `.js` import specifiers (tsdown bundles it); tests use `.ts` (Node resolves
  them directly).

## Before opening a PR

```bash
npm run check
npm pack --silent && npx publint && npx @arethetypeswrong/cli --pack .
```

Both packaging checks run in CI too. A package whose reason for existing is catching
packaging defects has no excuse for shipping one.

Verify against a real consumer before changing the fixture generator or the CLI:

```bash
npm i -D file:../next-testing-toolkit   # in a consuming package
npm run e2e
```

## Releasing

Publishing uses **npm trusted publishing (OIDC)** — there is no npm token anywhere in this
repo, and none should be added. `publish.yml` runs on GitHub release creation and must stay
local to this repo: with `workflow_call`, npm's trusted-publishing validation checks the
_calling_ workflow's name rather than the one containing the publish.

1. Bump the version and update the changelog.
2. Merge to `main`.
3. Create a GitHub release — the workflow publishes it.

### The first publish of a new package cannot use OIDC

npm will not let you configure a trusted publisher for a package that does not exist
yet, so there is a bootstrap step no repo can automate away. It applies to every new
package, not just this one:

1. Create the GitHub release as usual. `publish.yml` fires and **fails** at `npm
publish` — expected, there is no trusted publisher yet. Nothing partial reaches npm;
   the steps before it are only checkout, install, typecheck and build.
2. `npm login` and `npm publish` by hand — an interactive login, so no token is created
   or stored.
3. _Then_ register the trusted publisher on npmjs.com, which is only possible once the
   package exists. It is two steps: the entry, and the separate **Set up connection**
   button. Missing the second produces an E404 on the next publish that looks nothing
   like a configuration error.

The release leaves one failed run in the history. **Do not try to avoid it by disabling
`publish.yml` around the release.** Either order produces a failed run anyway — publish
first and the workflow fails on a version conflict instead — and disabling adds a state
you have to remember to restore. Forgetting `gh workflow enable` means every later
release silently publishes nothing, which is a far worse failure than a red run that is
loud, immediate and harmless.

That first version ships without provenance attestation, since provenance requires a
supported CI. Every later version has it.

**An npm version cannot be taken back.** Run the packaging checks first.
