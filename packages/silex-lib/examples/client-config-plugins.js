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
 * along with this program.  if not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview Run Silex with some plugins
 * Start silex with the environment variable SILEX_CLIENT_CONFIG or the CLI option --client-config set to this file
 */

//import websiteInfoPlugin from './plugins/client/website-info.js'
import templatePlugin from './plugins/client/template.js'

// This file is loaded by Silex when the user opens the editor
// Unless you override the default config with the environment variable SILEX_CLIENT_CONFIG or the CLI option --client-config
export default async function (config) {
  // Add plugins
  //config.addPlugin(websiteInfoPlugin, {})
  config.addPlugin(templatePlugin, {})
}

