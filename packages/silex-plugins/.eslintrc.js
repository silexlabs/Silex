/* eslint-env node */
module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    rules: {
        indent: ["error", 2],
        quotes: ["error", "single"],
        semi: ["error", "never"],
        "comma-dangle": ["error", "always"],
    },
};
