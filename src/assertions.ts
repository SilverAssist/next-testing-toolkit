/**
 * Assertions about a package's *built output*, not its source.
 *
 * These exist because the defects they catch live in `dist/` and are created
 * by the bundler, not by the code. Inlining a client module into a barrel
 * flattens away its "use client" directive; no source-level test can observe
 * that.
 *
 * Framework-agnostic on purpose: each returns a result rather than calling an
 * assertion library, so the same checks work under Jest, Vitest or `node:test`.
 *
 * @packageDocumentation
 */

import { existsSync, readFileSync } from "node:fs";

/** Outcome of a single boundary check. */
export interface BoundaryCheck {
  /** Human-readable name, suitable as a test title. */
  name: string;
  /** Whether the built output satisfies the rule. */
  ok: boolean;
  /** Why it failed, or how it passed. */
  detail: string;
}

/** Files to inspect for a package that ships client components. */
export interface ClientBoundaryPaths {
  /** Built client entry, which must carry the directive. */
  clientEntry: string;
  /**
   * Built root barrel, which must NOT carry it and must not inline the client.
   *
   * Omit for packages whose only entry is the client one.
   */
  rootEntry?: string;
  /**
   * Specifier the root is expected to re-export from, proving the module
   * boundary survived the build.
   */
  clientSpecifier?: string;
}

const HOOK_PATTERN = /\buse(?:State|Effect|Ref|Context|SyncExternalStore)\b/;

function read(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`Built file not found: ${path}. Run the build first.`);
  }
  return readFileSync(path, "utf8");
}

/**
 * Checks the React Server Components boundary of a package that ships client
 * components.
 *
 * The rule these encode: *a barrel may re-export across the RSC boundary, but
 * a bundle may not inline across it.*
 *
 * @param paths - Built files to inspect.
 * @returns One result per rule, in reporting order.
 */
export function checkClientBoundary(paths: ClientBoundaryPaths): BoundaryCheck[] {
  const results: BoundaryCheck[] = [];
  const client = read(paths.clientEntry);

  results.push({
    name: 'client entry carries the "use client" directive',
    ok: client.trimStart().startsWith('"use client"'),
    detail: client.trimStart().slice(0, 40),
  });

  if (!paths.rootEntry) return results;

  const root = read(paths.rootEntry);

  results.push({
    name: "root barrel does not inline the client module",
    ok: !HOOK_PATTERN.test(root),
    detail: HOOK_PATTERN.test(root)
      ? "found React hooks in the root bundle — the client module was inlined, which strips its directive"
      : "no hooks in the root bundle",
  });

  results.push({
    // Marking the root would ship any server-only code it re-exports -- secret
    // handling, for instance -- to the browser.
    name: "root barrel is not itself marked as client",
    ok: !root.trimStart().startsWith('"use client"'),
    detail: root.trimStart().slice(0, 40),
  });

  if (paths.clientSpecifier) {
    results.push({
      name: "root barrel re-exports the client entry",
      ok: root.includes(paths.clientSpecifier),
      detail: `looking for ${paths.clientSpecifier}`,
    });
  }

  return results;
}

/**
 * Checks that a package ships **no** client boundary at all.
 *
 * The inverse contract, for packages of pure server-renderable components --
 * an icon set, for example. One stray hook, or a directive added by a build
 * config, silently converts every component into a client component and starts
 * shipping JavaScript for what should be static markup.
 *
 * @param entries - Built files that must all be server-renderable.
 * @returns One result per rule, in reporting order.
 */
export function checkNoClientBoundary(entries: string[]): BoundaryCheck[] {
  return entries.flatMap((entry) => {
    const source = read(entry);
    return [
      {
        name: `${entry} carries no "use client" directive`,
        ok: !source.trimStart().startsWith('"use client"'),
        detail: source.trimStart().slice(0, 40),
      },
      {
        name: `${entry} uses no React hooks`,
        ok: !HOOK_PATTERN.test(source),
        detail: HOOK_PATTERN.exec(source)?.[0] ?? "none found",
      },
    ];
  });
}
