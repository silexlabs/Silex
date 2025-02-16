// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'indent': ['error', 2],
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'object-curly-spacing': ['error', 'always'] // Add this line
    }
  }
)
