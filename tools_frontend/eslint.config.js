import simpleImportSort from "eslint-plugin-simple-import-sort";
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  files: ["**/*.{ts,tsx}"],
  languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname }, globals: globals.browser },
  plugins: {
    "simple-import-sort": simpleImportSort,
    "react-hooks": reactHooks,
  },
  rules: {
    curly: ["error", "all"],
    "simple-import-sort/imports": ["error", { groups: [["^\\u0000"], ["^node:", "^@?\\w"], ["^\\."]] }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
});
