"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const bodyParser = require("body-parser");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const express = require("express");
const session = require("cookie-session");
const SslRouter_1 = require("./router/SslRouter");
const StaticRouter_1 = require("./router/StaticRouter");
const WebsiteRouter_1 = require("./router/WebsiteRouter");
function noCache(req, res, next) {
    res.header('Cache-Control', 'private,no-cache,no-store,must-revalidate,proxy-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
}
function withCache(req, res, next) {
    res.header('Cache-Control', 'public,max-age=86400,immutable');
    next();
}
const isReady = false;
async function start(config) {
    return new Promise((resolve, reject) => {
        const app = express();
        if (isReady) {
            resolve(app);
        }
        else {
            if (config.debug) {
                require('source-map-support').install();
            }
            app.use(compression());
            app.use(bodyParser.json({ limit: '1mb' }));
            app.use(bodyParser.text({ limit: '10mb' }));
            app.use(cookieParser());
            app.use(session({
                name: 'silex-session',
                secret: config.sessionSecret,
            }));
            app.use(withCache, (0, StaticRouter_1.default)(config));
            const websiteRouter = (0, WebsiteRouter_1.default)();
            app.use(noCache, websiteRouter);
            app.use((0, SslRouter_1.default)(config, app));
            app.listen(config.port, () => {
                resolve(app);
            });
        }
    });
}
exports.start = start;
