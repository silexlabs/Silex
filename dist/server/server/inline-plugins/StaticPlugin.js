"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = __importDefault(require("express"));
const serve_static_1 = __importDefault(require("serve-static"));
const Cache_1 = require("./Cache");
const events_1 = require("../events");
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
