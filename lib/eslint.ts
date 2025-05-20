import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import ts, { type ConfigArray } from "typescript-eslint";

type Config = ConfigArray[number];

type SharedConfigOptions = {
  parserOptions: NonNullable<Config["languageOptions"]>["parserOptions"] & {
    project: string[];
    tsconfigRootDir: string;
  };
};

/**
 * Sets up ESLint with shared ITC configuration.
 *
 * Example usage:
 *
 * ```js
 * import { itcSharedConfigs } from "@indietabletop/tooling/eslint";
 *
 * export default [
 *   // Set global ignores
 *   { ignores: ["eslint.config.js", "dist", "public"] },
 *
 *   // Use based configs that are applied to all files that are subsequently
 *   // matched by ESLint.
 *   ...itcSharedConfigs({
 *     parserOptions: {
 *       project: ["./tsconfig.json", "./tsconfig.node.json" ],
 *       tsconfigRootDir: import.meta.dirname,
 *     },
 *   }),
 *
 *   // Configure which files to match
 *   {
 *     files: ["**\/*.{ts,tsx}"],
 *
 *     // Rule overrides can go here
 *     rules: {
 *       "@typescript-eslint/no-deprecated": "error",
 *     },
 *   },
 * ];
 * ```
 */
export function itcSharedConfigs({
  parserOptions,
}: SharedConfigOptions): ConfigArray {
  return [
    js.configs.recommended,

    ...ts.configs.strictTypeChecked,

    {
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
        parserOptions: parserOptions,
      },
      plugins: {
        react,
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
      },
      settings: { react: { version: "detect" } },
      rules: {
        ...react.configs.recommended.rules,
        ...react.configs["jsx-runtime"].rules,
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": [
          "warn",
          { allowConstantExport: true },
        ],
        "@typescript-eslint/restrict-template-expressions": [
          "error",
          { allowNumber: true },
        ],
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            args: "all",
            argsIgnorePattern: "^_",
            caughtErrors: "all",
            caughtErrorsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            ignoreRestSiblings: true,
          },
        ],
      },
    },
  ];
}
