/**
 * Shared types for the fixture harness.
 *
 * @packageDocumentation
 */

/** Options for generating and building a fixture app. */
export interface FixtureOptions {
  /**
   * Port the fixture's production server listens on.
   *
   * Every package needs its own so suites can run in parallel without
   * colliding. This is the only value that genuinely differs between packages
   * — everything else is derived from the consumer's `package.json`.
   */
  port: number;

  /**
   * Next.js version range installed into the fixture.
   *
   * Defaults to the major the consuming apps run. Pin the *floor* of the
   * declared peer range instead when you want to catch the version that
   * breaks first.
   *
   * @defaultValue `"^16"`
   */
  nextVersion?: string;

  /** React version range installed into the fixture. @defaultValue `"^19"` */
  reactVersion?: string;

  /**
   * Extra module specifiers the fixture's root layout should import, such as a
   * package's optional stylesheet subpath.
   *
   * These are side-effect imports. Listing one here means the fixture build
   * fails if it stops resolving — which is how a `./styles` export pointing at
   * a file the build never emitted gets caught.
   */
  layoutImports?: string[];
}

/** Resolved fixture paths and metadata. */
export interface ResolvedFixture {
  /** Absolute path to the consuming package's root. */
  packageRoot: string;
  /** Absolute path to the generated fixture app. */
  fixtureDir: string;
  /** The consuming package's name, from its `package.json`. */
  packageName: string;
  /** Port the fixture serves on. */
  port: number;
}
