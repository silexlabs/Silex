const fs = require('fs');
const express = require('express');

module.exports = function(sslOptions, app) {
  const router = express.Router();

  // SSL
  // force ssl if the env var SILEX_FORCE_HTTPS is set
  if(sslOptions.forceHttps) {
    console.log('force SSL is active (env var SILEX_FORCE_HTTPS is set)');
    const forceSSL = require('express-force-ssl');
    app.set('forceSSLOptions', {
      trustXFPHeader: !!sslOptions.trustXFPHeader,
    });
    router.use(forceSSL);
  }
  else {
    console.log('force SSL NOT active (env var SILEX_FORCE_HTTPS is NOT set)');
  }

  // SSL certificate
  console.log('SSL: looking for env vars SILEX_SSL_CERTIFICATE and SILEX_SSL_PRIVATE_KEY');
  if(sslOptions.privateKey && sslOptions.certificate) {
    console.log('SSL: found certificate', sslOptions.certificate);
    try {
      var privateKey = fs.readFileSync(sslOptions.privateKey).toString();
      var certificate = fs.readFileSync(sslOptions.certificate).toString();

      var options = {
        key: privateKey,
        cert: certificate,
        requestCert: true,
        rejectUnauthorized: false
      };

      https.createServer(options, this).listen(sslOptions.sslPort, function() {
        console.log('SSL: listening on port ', sslOptions.sslPort);
      });
    }
    catch(e) {
      console.warn('SSL: load certificate failed.', e)
    }
  }
  return router;
};
