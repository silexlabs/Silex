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
if (process.env.SILEX_DEBUG) {
    const livereload = require('livereload');
    const { resolve } = require('path');
    const dist = resolve(__dirname, '../client');
    const server = livereload.createServer({
        delay: 0,
    }, () => {
        console.info(`\nDebug mode\nLive reload server is running.\nWatching ${dist}`);
    });
    server.watch(dist);
}
