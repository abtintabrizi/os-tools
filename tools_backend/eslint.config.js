import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["app/**/*.ts"],
    languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname }, globals: globals.node },
    rules: {
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
              group: ["node:*", "@supabase/*", "express", "ws", "../managers/*", "../repositories/*"],
              message: "Utilities must be pure; keep runtime effects in managers and database access in repositories.",
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
