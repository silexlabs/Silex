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

import { Config, Plugin } from '@silexlabs/silex-plugins'
import { getEditorConfig } from './grapesjs'
import { CLIENT_CONFIG_FILE_NAME, DEFAULT_LANGUAGE, DEFAULT_WEBSITE_ID } from '../constants'

/**
 * @fileoverview Silex client side config
 */

const id = new URL(location.href).searchParams.get('id') ?? DEFAULT_WEBSITE_ID
const lang = new URL(location.href).searchParams.get('lang') ?? DEFAULT_LANGUAGE
const rootUrl = `${location.protocol}//${location.host}${location.pathname}`

export class SilexConfig extends Config {
  /**
   * debug mode
   */
  debug = false

  /**
   * language for I18n module
   */
  lang = lang

  /**
   * Grapesjs config
   */
  editor = getEditorConfig(id, rootUrl)

  /**
   * Client config url
   * This is the url of the config file which is a plugin
   */
  clientConfigUrl = `${rootUrl}${CLIENT_CONFIG_FILE_NAME}`

  /**
   * GrapesJs plugins
   */
  grapesJsPlugins: Plugin[] = []
}
