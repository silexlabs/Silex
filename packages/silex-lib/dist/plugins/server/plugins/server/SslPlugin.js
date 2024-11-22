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
const fs_1 = require("fs");
const https_1 = require("https");
const express_force_ssl_1 = __importDefault(require("express-force-ssl"));
const events_1 = require("../../server/events");
// interface SslOptions {
//   forceHttps?: boolean
//   trustXFPHeader?: boolean
//   privateKey?: string
//   certificate?: string
//   sslPort?: string
// }
async function default_1(config, opts = {}) {
    // Options with defaults
    const options = {
        forceHttps: process.env.SILEX_FORCE_HTTPS === 'true',
        trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER === 'true',
        privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
        certificate: process.env.SILEX_SSL_CERTIFICATE,
        sslPort: process.env.SSL_PORT || '443',
        ...opts,
    };
    // Add routes on silex startup
    config.on(events_1.ServerEvent.STARTUP_START, ({ app }) => {
        const router = express_1.default.Router();
        // SSL
        // force ssl if the env var SILEX_FORCE_HTTPS is set
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
        // SSL certificate
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
//# sourceMappingURL=SslPlugin.js.map