import type {Config} from 'jest';

const config: Config = {
  //testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/old/', '<rootDir>/strapi/'],
  //transformIgnorePatterns: ['<rootDir>/node_modules/'],
  //moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'jsdom',
};

export default config;