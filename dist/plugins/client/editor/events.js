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
export var ClientEvent;
(function (ClientEvent) {
    // Sent on the config object
    ClientEvent["STARTUP_START"] = "silex:startup:start";
    ClientEvent["STARTUP_END"] = "silex:startup:end";
    ClientEvent["GRAPESJS_START"] = "silex:grapesjs:start";
    ClientEvent["GRAPESJS_END"] = "silex:grapesjs:end";
    // Sent on GrapesJs editor object (returned by silex.getEditor())
    ClientEvent["PUBLICATION_UI_OPEN"] = "silex:publication-ui:open";
    ClientEvent["PUBLICATION_UI_CLOSE"] = "silex:publication-ui:close";
    ClientEvent["PUBLISH_BEFORE"] = "silex:publish:before";
    ClientEvent["PUBLISH_START"] = "silex:publish:start";
    ClientEvent["PUBLISH_PAGE"] = "silex:publish:page";
    ClientEvent["PUBLISH_DATA"] = "silex:publish:data";
    ClientEvent["PUBLISH_END"] = "silex:publish:end";
    ClientEvent["PUBLISH_ERROR"] = "silex:publish:error";
    ClientEvent["PUBLISH_LOGIN_START"] = "silex:publish:login:start";
    ClientEvent["PUBLISH_LOGIN_END"] = "silex:publish:login:end";
    ClientEvent["ASSET_WRITE_END"] = "silex:asset:write:end";
    ClientEvent["WRITE_END"] = "silex:write:end";
    ClientEvent["SETTINGS_OPEN"] = "silex:settings:open";
    ClientEvent["SETTINGS_CLOSE"] = "silex:settings:close";
    ClientEvent["SETTINGS_SAVE_START"] = "silex:settings:save:start";
    ClientEvent["SETTINGS_SAVE_END"] = "silex:settings:save:end";
    ClientEvent["SETTINGS_SECTION_CHANGE"] = "silex:settings:section-change";
})(ClientEvent || (ClientEvent = {}));
//# sourceMappingURL=events.js.map