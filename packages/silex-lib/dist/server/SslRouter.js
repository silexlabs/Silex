const fs = require('fs');
const express = require('express');

module.exports = function() {
  const router = express.Router();

  // SSL
  // force ssl if the env var SILEX_FORCE_HTTPS is set
  if(process.env.SILEX_FORCE_HTTPS) {
    console.log('force SSL is active (env var SILEX_FORCE_HTTPS is set)');
    const forceSSL = require('express-force-ssl');
    router.set('forceSSLOptions', {
      trustXFPHeader: !!process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER
    });
    router.use(forceSSL);
  }
  else {
    console.log('force SSL NOT active (env var SILEX_FORCE_HTTPS is NOT set)');
  }

  // SSL certificate
  console.log('SSL: looking for env vars SILEX_SSL_CERTIFICATE and SILEX_SSL_PRIVATE_KEY');
  if(process.env.SILEX_SSL_PRIVATE_KEY && process.env.SILEX_SSL_CERTIFICATE) {
    console.log('SSL: found certificate', process.env.SILEX_SSL_CERTIFICATE);
    try {
      var privateKey = fs.readFileSync(process.env.SILEX_SSL_PRIVATE_KEY).toString();
      var certificate = fs.readFileSync(process.env.SILEX_SSL_CERTIFICATE).toString();

      var options = {
        key: privateKey,
        cert: certificate,
        requestCert: true,
        rejectUnauthorized: false
      };

      var sslPort = process.env.SSL_PORT || 443;
      https.createServer(options, this).listen(sslPort, function() {
        console.log('SSL: listening on port ', sslPort);
      });
    }
    catch(e) {
      console.warn('SSL: load certificate failed.', e)
    }
  }
  return router;
};
