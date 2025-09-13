import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    ignores: ["node_modules", "**/www/*", "**/.venv/*"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["build.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-undef": "off",
    },
  },
]);
