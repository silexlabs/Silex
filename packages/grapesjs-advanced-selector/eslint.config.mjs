// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Set indentation to 2 spaces
      'indent': ['error', 2],
      // Forbid unused variables
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      // Remove unnecessary semicolons
      'semi': ['error', 'never']
    }
  }
)
