/**
 * Tests for the `npm pack --json` output normalization.
 *
 * This is the piece of `buildFixture` that does not need a real shell-out to
 * exercise: the parsing logic that every one of this harness's downstream
 * consumers relies on to find the tarball it just packed.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { packedTarballFilename } from "../fixture/build.ts";

describe("packedTarballFilename", () => {
  it("reads the filename from the npm 12+ object-keyed-by-name shape", () => {
    const raw = JSON.stringify({ "@scope/pkg": { filename: "scope-pkg-1.0.0.tgz" } });
    assert.equal(packedTarballFilename(raw), "scope-pkg-1.0.0.tgz");
  });

  it("reads the filename from the pre-npm-12 array shape", () => {
    const raw = JSON.stringify([{ filename: "scope-pkg-1.0.0.tgz" }]);
    assert.equal(packedTarballFilename(raw), "scope-pkg-1.0.0.tgz");
  });

  it("throws a build-shaped message when the array is empty", () => {
    assert.throws(() => packedTarballFilename(JSON.stringify([])), /Could not read a filename/);
  });

  it("throws a build-shaped message when the object has no filename", () => {
    assert.throws(
      () => packedTarballFilename(JSON.stringify({ "@scope/pkg": {} })),
      /Could not read a filename/
    );
  });
});
