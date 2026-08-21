import js from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

import { ESLINT_IGNORE_PATTERNS } from "./src/ignore-patterns.ts";

export default [
  { ignores: ESLINT_IGNORE_PATTERNS },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { console: "readonly", process: "readonly" },
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
