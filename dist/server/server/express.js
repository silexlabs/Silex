"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.start = start;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const cors_1 = __importDefault(require("cors"));
const events_1 = require("./events");
function create(config) {
    const app = (0, express_1.default)();
    app.set('config', config);
    const options = config.expressOptions;
    if (options.cors) {
        console.info('> CORS are ENABLED:', options.cors);
        app.use((0, cors_1.default)({
            origin: options.cors,
        }));
    }
    app.use((0, compression_1.default)());
    app.use(body_parser_1.default.json({ limit: options.jsonLimit }));
    app.use(body_parser_1.default.text({ limit: options.textLimit }));
    app.use(body_parser_1.default.urlencoded({ limit: options.urlencodedLimit }));
    console.info('> Session name:', options.sessionName);
    app.use((0, cookie_parser_1.default)());
    app.use((0, cookie_session_1.default)({
        name: options.sessionName,
        secret: options.sessionSecret,
    }));
    return app;
}
async function start(app) {
    const config = app.get('config');
    config.emit(events_1.ServerEvent.STARTUP_START, { app });
    return new Promise((resolve, reject) => {
        app.listen(config.port, () => {
            config.emit(events_1.ServerEvent.STARTUP_END, { app });
            resolve(app);
        });
    });
}
