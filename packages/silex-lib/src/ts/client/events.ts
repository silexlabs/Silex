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

export enum ClientEvent {
  // Sent on the config object
  STARTUP_START = 'silex:startup:start',
  STARTUP_END = 'silex:startup:end',
  GRAPESJS_START = 'silex:grapesjs:start',
  GRAPESJS_END = 'silex:grapesjs:end',

  // Sent on the editor object
  PUBLISH_START = 'silex:publish:start',
  PUBLISH_DATA = 'silex:publish:data',
  PUBLISH_END = 'silex:publish:end',
  PUBLISH_ERROR = 'silex:publish:error',
  PUBLISH_LOGIN_START = 'silex:publish:login:start',
  PUBLISH_LOGIN_END = 'silex:publish:login:end',
  ASSET_WRITE_END = 'silex:asset:write:end',
  WRITE_END = 'silex:write:end',
  SETTINGS_OPEN = 'silex:settings:open',
  SETTINGS_CLOSE = 'silex:settings:close',
  SETTINGS_SAVE_START = 'silex:settings:save:start',
  SETTINGS_SAVE_END = 'silex:settings:save:end',
  SETTINGS_SECTION_CHANGE = 'silex:settings:section-change',
}
