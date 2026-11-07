import simpleImportSort from "eslint-plugin-simple-import-sort";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["app/**/*.ts"],
    plugins: { "simple-import-sort": simpleImportSort },
    languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname }, globals: globals.node },
    rules: {
      "simple-import-sort/imports": [
        "error",
        { groups: [["^\\u0000"], ["^node:", "^@?\\w"], ["^@/", "^@map-drafter/", "^\\."]] },
      ],
      curly: ["error", "all"],
      "arrow-body-style": ["error", "always"],
      "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "explicit" }],
    },
  },
  {
    files: ["app/utils/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../managers/*"],
              allowTypeImports: true,
              message: "Utilities may import manager types only; runtime effects belong in managers.",
            },
            {
              group: ["node:*", "@supabase/*", "express", "ws"],
              message: "Utilities must be pure; keep runtime effects in managers and database access in RoomManager.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "Pass timestamps into utilities instead of reading the clock.",
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Pass timestamps into utilities instead of reading the clock.",
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: "Make random choices in managers.",
        },
        {
          selector: "CallExpression[callee.name=/^(setTimeout|setInterval|fetch)$/]",
          message: "Utilities must not perform runtime side effects.",
        },
        {
          selector: "CallExpression[callee.object.name='console']",
          message: "Log from managers or transport code, not utilities.",
        },
      ],
    },
  },
);
