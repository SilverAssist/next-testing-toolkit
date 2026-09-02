// This package has no client-boundary component of its own to prove -- what
// needs proving instead is that both entry points in its `exports` map (".")
// and ("./assertions") actually resolve when a real Server Component imports
// the packed tarball. That's the packaging-defect class the README's own
// table leads with ("an exports map pointing at files the build never
// produced"), applied to this package by itself.
import {
  definePackageFixtureConfig,
  ESLINT_IGNORE_PATTERNS,
} from "@silverassist/next-testing-toolkit";
import { checkNoClientBoundary } from "@silverassist/next-testing-toolkit/assertions";

export default function Page() {
  const config = definePackageFixtureConfig({ port: 1 });

  return (
    <main>
      <h1>next-testing-toolkit fixture</h1>
      <p data-testid="base-url">{config.use?.baseURL}</p>
      <p data-testid="ignore-count">{ESLINT_IGNORE_PATTERNS.length}</p>
      <p data-testid="assertions-fn">{typeof checkNoClientBoundary}</p>
    </main>
  );
}
