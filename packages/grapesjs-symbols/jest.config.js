/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  transform: {
    '.*\\.ts': ['ts-jest', { tsconfig: 'tsconfig.test.json' }]
  },
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'jsdom',
}
