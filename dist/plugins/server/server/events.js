"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerEvent = void 0;
var ServerEvent;
(function (ServerEvent) {
    ServerEvent["STARTUP_START"] = "startup-start";
    ServerEvent["STARTUP_END"] = "startup-end";
    ServerEvent["PUBLISH_START"] = "publish-start";
    ServerEvent["PUBLISH_END"] = "publish-end";
    ServerEvent["WEBSITE_STORE_START"] = "store-start";
    ServerEvent["WEBSITE_STORE_END"] = "store-end";
    ServerEvent["WEBSITE_ASSET_STORE_START"] = "asset-store-start";
    ServerEvent["WEBSITE_ASSET_STORE_END"] = "asset-store-end";
})(ServerEvent || (exports.ServerEvent = ServerEvent = {}));
//# sourceMappingURL=events.js.map