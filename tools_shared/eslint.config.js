import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["dist/**"] }, js.configs.recommended, ...tseslint.configs.recommended, {
  files: ["src/**/*.ts"],
  languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
  plugins: { "simple-import-sort": simpleImportSort },
  rules: {
    "simple-import-sort/imports": [
      "error",
      { groups: [["^\\u0000"], ["^node:", "^@?\\w"], ["^@/", "^@map-drafter/", "^\\."]] },
    ],
  },
});
