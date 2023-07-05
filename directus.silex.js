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

module.exports = function (silexConfig) {
  // Add plugins
  silexConfig.addPlugin(__dirname + '/src/plugins/AuthPlugin', {
    directusUrl: process.env.DIRECTUS_SERVER_TO_SERVER_URL || process.env.DIRECTUS_URL,
    directusToken: process.env.DIRECTUS_TOKEN, // In case no token is passed in the request body
  })
}
