module.exports = {
  "testMatch": ['<rootDir>/**/*.test.ts'],
  "testEnvironment": 'jsdom',
  "extensionsToTreatAsEsm": [".ts"],
  "transform": {
    ".ts": ['ts-jest', {
      "useESM": true,
    }],
  },
};
