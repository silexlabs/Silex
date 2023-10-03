import type {Config} from 'jest';

const config: Config = {
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/old/'],
};

export default config;