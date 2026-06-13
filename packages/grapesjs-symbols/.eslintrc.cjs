module.exports = {
  'ignorePatterns': ['*.test.ts'],
  'env': {
    'browser': true,
    'es2021': true
  },
  'extends': 'eslint:recommended',
  "parser": "@typescript-eslint/parser",
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'rules': {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never', { 'beforeStatementContinuationChars': 'always' }],
    'no-unused-vars': 0,
  }
}
