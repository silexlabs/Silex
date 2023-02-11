"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const config_1 = require("./config");
const start_1 = require("./start");
(0, start_1.start)(config_1.config).then((app) => {
    console.info(`
I'm ready, listening to port ${config_1.config.port}
${config_1.config.url}
  `);
});
const livereload_1 = require("livereload");
const path_1 = require("path");
if (process.env.SILEX_DEBUG) {
    const dist = (0, path_1.resolve)(__dirname, '../client');
    const server = livereload_1.default.createServer({
        delay: 0,
    }, () => {
        console.info(`\nDebug mode\nLive reload server is running.\nWatching ${dist}`);
    });
    server.watch(dist);
}
