"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const nodeModules = require("node_modules-path");
const serveStatic = require("serve-static");
const Path = require("path");
const rootPath = Path.join(__dirname, '../../..');
function default_1(config) {
    const router = express.Router();
    config.staticOptions.routes
        .forEach(folder => {
        const rootFolder = folder.module ? `${nodeModules(folder.module)}/${folder.module}` : rootPath;
        const path = Path.join(rootFolder, folder.path || '');
        const route = folder.module && !folder.route ? `/libs/${folder.module}` : folder.route;
        if (!route)
            throw new Error('The config for static module requires either `route` or `module`');
        router.use(route, serveStatic(path));
    });
    return router;
}
exports.default = default_1;
