/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/ts/plugins/client/**/*.test.ts'],
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
      testMatch: ['<rootDir>/src/ts/plugins/server/**/*.test.ts'],
      extensionsToTreatAsEsm: [".ts"],
      transform: {
        ".ts": ['ts-jest', {
          useESM: true,
        }],
      },
    },
  ],
};
