module.exports = {
  'ignorePatterns': ['*.test.js'],
  'env': {
    'browser': true,
    'es2021': true
  },
  'extends': 'eslint:recommended',
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
