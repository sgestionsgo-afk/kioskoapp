/**
 * Lightweight ESLint config for development
 * Use: npx eslint --config eslint.dev.mjs
 */
import js from "@eslint/js";

export default [
  {
    files: ["src/**/*.ts"],
    ignores: ["node_modules/", "dist/", ".next/"],
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "warn",
    },
  },
];
