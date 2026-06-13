module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/src/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/test-data.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@jest/.*|ts-jest|.*\\.mjs$))'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
}