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

/**
 * @fileoverview define constants for Silex client and server
 */

export const WEBSITE_DATA_FILE = 'website.json'
export const WEBSITE_META_DATA_FILE = 'meta.json'

export const DEFAULT_WEBSITE_ID = 'default'
export const DEFAULT_LANGUAGE = 'en'
export const CLIENT_CONFIG_FILE_NAME = 'silex.js'

export const API_PATH = '/api'

export const API_CONNECTOR_PATH = '/connector'
export const API_CONNECTOR_USER = '/user'
export const API_CONNECTOR_LIST = '/'
export const API_CONNECTOR_LOGOUT = '/logout'
export const API_CONNECTOR_LOGIN = '/login'
export const API_CONNECTOR_SETTINGS = '/settings'
export const API_CONNECTOR_LOGIN_CALLBACK = '/login/callback'

export const API_PUBLICATION_PATH = '/publication'
export const API_PUBLICATION_PUBLISH = '/'
export const API_PUBLICATION_STATUS = '/publication/status'

export const API_WEBSITE_PATH = '/website'
export const API_WEBSITE_READ = '/'
export const API_WEBSITE_WRITE = '/'
export const API_WEBSITE_CREATE = '/'
export const API_WEBSITE_DELETE = '/'
export const API_WEBSITE_DUPLICATE = '/duplicate'
export const API_WEBSITE_LIST = '/'
export const API_WEBSITE_ASSET_READ = '/assets'
export const API_WEBSITE_ASSETS_WRITE = '/assets'
export const API_WEBSITE_META_READ = '/meta'
export const API_WEBSITE_META_WRITE = '/meta'

// Env vars (build time)
// Get env vars from webpack
// @see webpack.config.js
declare const SILEX_VERSION_ENV: string
export let SILEX_VERSION
try { SILEX_VERSION = SILEX_VERSION_ENV } catch (e) {
  // fallback to default value
  SILEX_VERSION = SILEX_VERSION || '3.0.0'
}

export const DEV_MESSAGE = `
__________________________________________________________

  Create static websites visually, with dynamic content,
  in the free spirit of the web.

  ███████ ██ ██      ███████ ██   ██     ██    ██ ██████
  ██      ██ ██      ██       ██ ██      ██    ██      ██
  ███████ ██ ██      █████     ███       ██    ██  █████
       ██ ██ ██      ██       ██ ██       ██  ██       ██
  ███████ ██ ███████ ███████ ██   ██       ████   ██████ ${SILEX_VERSION.slice(1)}

  Users are expected to contribute:

  * Web designers: https://docs.silex.me/en/user/contribute
  * Developers: https://docs.silex.me/en/dev/contribute

__________________________________________________________
`
