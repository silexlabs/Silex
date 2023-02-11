"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs_1 = require("fs");
const https_1 = require("https");
const express_force_ssl_1 = require("express-force-ssl");
function default_1(config, app) {
    const router = express.Router();
    if (config.sslOptions.forceHttps) {
        console.log('> Force SSL option is enabled');
        app.set('forceSSLOptions', {
            trustXFPHeader: !!config.sslOptions.trustXFPHeader,
        });
        router.use(express_force_ssl_1.default);
    }
    else {
        console.log('> Force SSL option is disabled, env var SILEX_FORCE_HTTPS not set');
    }
    if (config.sslOptions.privateKey && config.sslOptions.certificate) {
        console.log('> SSL certificate is enabled, found certificate:', config.sslOptions.certificate);
        try {
            const privateKey = (0, fs_1.readFileSync)(config.sslOptions.privateKey).toString();
            const certificate = (0, fs_1.readFileSync)(config.sslOptions.certificate).toString();
            const options = {
                key: privateKey,
                cert: certificate,
                requestCert: true,
                rejectUnauthorized: false,
            };
            (0, https_1.createServer)(options, this).listen(config.sslOptions.sslPort, () => {
                console.log('SSL: listening on port ', config.sslOptions.sslPort);
            });
        }
        catch (e) {
            console.error('SSL: load certificate failed.', e);
        }
    }
    else {
        console.log('> SSL certificate disabled, env vars SILEX_SSL_CERTIFICATE and SILEX_SSL_PRIVATE_KEY not set');
    }
    return router;
}
exports.default = default_1;
