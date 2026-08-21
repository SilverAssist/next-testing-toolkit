import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    assertions: "src/assertions.ts",
    cli: "src/cli.ts",
  },
  format: ["cjs", "esm"],
  dts: { sourcemap: false },
  clean: true,
  sourcemap: true,
  // ESM-only package: `false` yields .js/.d.ts, matching the exports map.
  fixedExtension: false,
  treeshake: true,
  minify: false,
  deps: { neverBundle: ["@playwright/test"] },
});
