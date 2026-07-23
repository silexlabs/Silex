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

import { readFile } from 'fs/promises'
import { ServerConfig } from './config.js'

const envKeys = ['SILEX_URL', 'SILEX_PROTOCOL', 'SILEX_HOST', 'SILEX_PORT'] as const
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]))

afterEach(() => {
  envKeys.forEach(key => {
    const value = originalEnv[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  })
})

describe('server URL configuration', () => {
  test('Docker image defaults do not override host-based configuration', async () => {
    const dockerfile = await readFile('Dockerfile', 'utf8')
    expect(dockerfile).not.toMatch(/^ENV SILEX_URL=/m)
  })

  test('environment defaults do not override host-based configuration', async () => {
    const envDefaults = await readFile('.env.default', 'utf8')
    expect(envDefaults).not.toMatch(/^SILEX_URL=/m)
  })

  test('falls back to protocol, host, and port when SILEX_URL is unset', () => {
    delete process.env.SILEX_URL
    process.env.SILEX_PROTOCOL = 'http'
    process.env.SILEX_HOST = '192.168.1.179'
    process.env.SILEX_PORT = '6805'

    expect(new ServerConfig().url).toBe('http://192.168.1.179:6805')
  })
})
