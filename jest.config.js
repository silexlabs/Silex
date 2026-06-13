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

// Monorepo single-package layout: map the ~/ path aliases (mirror of tsconfig "paths")
// and the grapesjs-* plugin sources so jest resolves them like webpack/tsc do.
const moduleNameMapper = {
  '^~/common/(.*)$': '<rootDir>/common/$1',
  '^~/common$': '<rootDir>/common',
  '^~/editor/(.*)$': '<rootDir>/editor/$1',
  '^~/server/(.*)$': '<rootDir>/server/$1',
  '^~/plugins/(.*)$': '<rootDir>/plugins/$1',
  '^@silexlabs/expression-input$': '<rootDir>/plugins/expression-input/src/index.ts',
  '^@silexlabs/grapesjs-([^/]+)$': '<rootDir>/plugins/grapesjs-$1/src/index',
}

const transform = {
  // isolatedModules: transpile-only, no type-checking during tests.
  // Type-checking is a separate CI step (tsc/lint), like the webpack build.
  '.ts': ['ts-jest', { useESM: true, isolatedModules: true }],
}
const common = {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper,
  transform,
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}

module.exports = {
  projects: [
    {
      ...common,
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/editor/**/*.test.ts'],
    },
    {
      ...common,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/**/*.test.ts', '<rootDir>/common/**/*.test.ts'],
    },
  ],
}
