import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "node_modules/*",
        "docs/*",
        "docs-src/*",
        "**/rollup-config.js",
        "**/custom-elements.json",
        "**/web-dev-server.config.js",
        "src/test/*",
    ],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/no-incompatible-property-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        quotes: ["error", "single"],
        semi: ["error", "never"],
    },
}, {
    files: ["**/rollup.config.js", "**/web-test-runner.config.js"],

    languageOptions: {
        globals: {
            ...globals.node,
        },
    },
}, {
    files: [
        "**/*_test.ts",
        "**/custom_typings/*.ts",
        "packages/labs/ssr/src/test/integration/tests/**",
        "packages/labs/ssr/src/lib/util/parse5-utils.ts",
    ],

    rules: {
        "@typescript-eslint/no-explicit-any": "off",
    },
}];