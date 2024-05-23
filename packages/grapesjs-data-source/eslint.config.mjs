import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "script" }
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "semi": "off",
      "@typescript-eslint/semi": ["error", "never"],
    }
  }
];