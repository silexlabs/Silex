"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs = require("fs");
const https = require("https");
function default_1(sslOptions, app) {
    const router = express.Router();
    // SSL
    // force ssl if the env var SILEX_FORCE_HTTPS is set
    if (sslOptions.forceHttps) {
        console.log('> Force SSL option is enabled');
        const forceSSL = require('express-force-ssl');
        app.set('forceSSLOptions', {
            trustXFPHeader: !!sslOptions.trustXFPHeader,
        });
        router.use(forceSSL);
    }
    else {
        console.log('> Force SSL option is disabled, env var SILEX_FORCE_HTTPS not set');
    }
    // SSL certificate
    if (sslOptions.privateKey && sslOptions.certificate) {
        console.log('> SSL certificate is enabled, found certificate:', sslOptions.certificate);
        try {
            const privateKey = fs.readFileSync(sslOptions.privateKey).toString();
            const certificate = fs.readFileSync(sslOptions.certificate).toString();
            const options = {
                key: privateKey,
                cert: certificate,
                requestCert: true,
                rejectUnauthorized: false,
            };
            https.createServer(options, this).listen(sslOptions.sslPort, () => {
                console.log('SSL: listening on port ', sslOptions.sslPort);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3NsUm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9yb3V0ZXIvU3NsUm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWtDO0FBQ2xDLHlCQUF3QjtBQUN4QiwrQkFBOEI7QUFFOUIsbUJBQXdCLFVBQVUsRUFBRSxHQUFHO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUUvQixNQUFNO0lBQ04sb0RBQW9EO0lBQ3BELElBQUksVUFBVSxDQUFDLFVBQVUsRUFBRTtRQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUE7UUFDNUMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFDN0MsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRTtZQUN6QixjQUFjLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxjQUFjO1NBQzVDLENBQUMsQ0FBQTtRQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7S0FDckI7U0FBTTtRQUNMLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUVBQW1FLENBQUMsQ0FBQTtLQUNqRjtJQUVELGtCQUFrQjtJQUNsQixJQUFJLFVBQVUsQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLFdBQVcsRUFBRTtRQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLGtEQUFrRCxFQUFFLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUN2RixJQUFJO1lBQ0YsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDcEUsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7WUFFdEUsTUFBTSxPQUFPLEdBQUc7Z0JBQ2QsR0FBRyxFQUFFLFVBQVU7Z0JBQ2YsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixrQkFBa0IsRUFBRSxLQUFLO2FBQzFCLENBQUE7WUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVELENBQUMsQ0FBQyxDQUFBO1NBQ0g7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxDQUFDLENBQUE7U0FDbEQ7S0FDRjtTQUFNO1FBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4RkFBOEYsQ0FBQyxDQUFBO0tBQzVHO0lBQ0QsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDO0FBeENELDRCQXdDQyJ9