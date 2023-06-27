module.exports = {
  projects: [
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/ts/client/**/*.test.ts'],
      extensionsToTreatAsEsm: [".ts"],
      transform: {
        ".ts": ['ts-jest', {
          useESM: true,
        }],
      },
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/ts/server/**/*.test.ts'],
      extensionsToTreatAsEsm: [".ts"],
      transform: {
        ".ts": ['ts-jest', {
          useESM: true,
        }],
      },
    },
  ],
};