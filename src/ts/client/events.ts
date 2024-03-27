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
  STARTUP_START = 'silex:startup:start', /* Loading is over and Silex is starting */
  STARTUP_END = 'silex:startup:end', /* Silex is ready to be used */
  GRAPESJS_START = 'silex:grapesjs:start', /* GrapesJS is about to be initialized, it is time to edit config.grapesJsConfig */
  GRAPESJS_END = 'silex:grapesjs:end', /* GrapesJS is ready to be used, `editor` is passed as an argument */

  // Sent on GrapesJs editor object (returned by silex.getEditor())
  PUBLISH_START = 'silex:publish:start', /* Publication starts, you can read+write {projectData, siteSettings} */
  PUBLISH_PAGE = 'silex:publish:page', /* Publication of a page, read+write { siteSettings, pageSettings } */
  PUBLISH_DATA = 'silex:publish:data', /* Just before we send the published data to the server, read+write all publication data, check PublicationData type in types.ts */
  PUBLISH_END = 'silex:publish:end', /* Publication is over, the argument is the publication result with {success: boolean, message: string} */
  PUBLISH_ERROR = 'silex:publish:error', /* Publication failed, the argument is the publication result with {success: boolean, message: string} */
  PUBLISH_LOGIN_START = 'silex:publish:login:start',
  PUBLISH_LOGIN_END = 'silex:publish:login:end',
  ASSET_WRITE_END = 'silex:asset:write:end',
  WRITE_END = 'silex:write:end',
  SETTINGS_OPEN = 'silex:settings:open', /* The settings dialog is opened */
  SETTINGS_CLOSE = 'silex:settings:close', /* The settings dialog is closed */
  SETTINGS_SAVE_START = 'silex:settings:save:start', /* The settings dialog is closed and the settings are about to be saved */
  SETTINGS_SAVE_END = 'silex:settings:save:end', /* The settings dialog is closed and the settings are saved */
  SETTINGS_SECTION_CHANGE = 'silex:settings:section-change', /* The user clicked on a section in the settings dialog */
}
