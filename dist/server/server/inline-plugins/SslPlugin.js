"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const https_1 = require("https");
const express_force_ssl_1 = __importDefault(require("express-force-ssl"));
const events_1 = require("../events");
async function default_1(config, opts = {}) {
    const options = {
        forceHttps: process.env.SILEX_FORCE_HTTPS === 'true',
        trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER === 'true',
        privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
        certificate: process.env.SILEX_SSL_CERTIFICATE,
        sslPort: process.env.SSL_PORT || '443',
        ...opts,
    };
    config.on(events_1.ServerEvent.STARTUP_START, ({ app }) => {
        const router = express_1.default.Router();
        if (options.forceHttps) {
            console.info('> [SslPlugin] Force SSL option is enabled');
            app.set('forceSSLOptions', {
                trustXFPHeader: !!options.trustXFPHeader,
            });
            router.use(express_force_ssl_1.default);
        }
        else {
            console.info('> [SslPlugin] Force SSL option is disabled, env var SILEX_FORCE_HTTPS not set');
        }
        if (options.privateKey && options.certificate) {
            console.info('> [SslPlugin] SSL certificate is enabled, found certificate:', options.certificate);
            try {
                const privateKey = (0, fs_1.readFileSync)(options.privateKey).toString();
                const certificate = (0, fs_1.readFileSync)(options.certificate).toString();
                const sslServerOptions = {
                    key: privateKey,
                    cert: certificate,
                    requestCert: true,
                    rejectUnauthorized: false,
                };
                (0, https_1.createServer)(sslServerOptions, this).listen(options.sslPort, () => {
                    console.info('> [SslPlugin] Listening on port ', options.sslPort);
                });
            }
            catch (e) {
                console.error('> [SslPlugin] Load certificate failed.', e);
            }
        }
        else {
            console.info('> [SslPlugin] Certificate disabled, env vars SILEX_SSL_CERTIFICATE and SILEX_SSL_PRIVATE_KEY not set');
        }
        app.use(router);
    });
}
