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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = __importDefault(require("express"));
const serve_static_1 = __importDefault(require("serve-static"));
const Cache_1 = require("./Cache");
const events_1 = require("../../server/events");
async function default_1(config, options = { routes: [] }) {
    if (!options.routes)
        throw new Error('The config for static module has no `routes` attribute');
    console.info(`> [StaticPlugin] Serving ${options.routes.length} static files`);
    config.on(events_1.ServerEvent.STARTUP_START, ({ app }) => {
        const router = express_1.default.Router();
        options.routes
            .forEach(folder => {
            if (!folder.route)
                throw new Error('The config for static module has no `route` attribute');
            if (!folder.path)
                throw new Error('The config for static module has no `path` attribute');
            console.info(`> [StaticPlugin] Serving static files from ${folder.path} on ${folder.route}`);
            router.use(folder.route, (0, serve_static_1.default)(folder.path));
        });
        app.use(Cache_1.withCache, router);
    });
}
//# sourceMappingURL=StaticPlugin.js.map