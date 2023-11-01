import type {Config} from 'jest';

const config: Config = {
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/old/', '<rootDir>/strapi/'],
};

export default config;