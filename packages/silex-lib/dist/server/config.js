"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const port = process.env.PORT || '6805';
const debug = process.env.SILEX_DEBUG === 'true';
exports.config = {
    port,
    debug,
    url: process.env.SERVER_URL || `http://localhost:${port}`,
    apiPath: '/api',
    sessionSecret: process.env.SILEX_SESSION_SECRET || 'replace this session secret in env vars',
    sslOptions: {
        forceHttps: process.env.SILEX_FORCE_HTTPS === 'true',
        trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER === 'true',
        privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
        certificate: process.env.SILEX_SSL_CERTIFICATE,
        sslPort: process.env.SSL_PORT || '443',
    },
    staticOptions: {
        routes: [
            {
                route: '/',
                path: 'public',
            }, {
                route: '/',
                path: 'dist/client',
            },
        ]
            .concat(debug ? [{
                route: '/',
                path: './',
            }] : []),
    },
};
