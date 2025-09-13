import tsParser from "@typescript-eslint/parser";
import reactEslint from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import path from "path";
import tseslint from "typescript-eslint";
import url from "url";

const currentFilename = url.fileURLToPath(new URL(import.meta.url));
const currentDirname = path.dirname(currentFilename);

const commonRules = {
  curly: ["warn", "multi-line"],
  eqeqeq: "warn",
  "no-throw-literal": "warn",
  semi: "warn",
  "@typescript-eslint/naming-convention": "off",
  "@typescript-eslint/no-empty-object-type": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/consistent-type-imports": "warn",
};

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules", "**/www/*", "**/.venv/*"],
  },
  {
    // JavaScript scripts - these are run by nodejs.
    files: ["eslint.config.js", "bin/**/*.js"],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2022,
      sourceType: "script",
    },
    rules: {
      ...commonRules,
      "@typescript-eslint/no-require-imports": "off",
      "no-constant-condition": ["error", { checkLoops: false }],
    },
  },
  {
    // Browser/React TypeScript
    files: ["templates/**/*.{ts,tsx}"],
    ...reactEslint.configs.flat.recommended,
    ...reactEslint.configs.flat["jsx-r1time"],
    plugins: {
      react: reactEslint,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: currentDirname,
        project: "tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...commonRules,
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
]);
