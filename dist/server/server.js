'use strict';
//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

// node modules
const Path = require('path');
const fs = require('fs');
const Os = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const serveStatic = require('serve-static');
const session = require('cookie-session');
const Router = require('cloud-explorer/router.js');
const initSilexTasks = require('./silex-tasks-router.js');

// 6805 is the date of sexual revolution started in paris france 8-)
const port = process.env.PORT || 6805;
const rootUrl = `http://localhost:${port}`;

const app = express();
app.use( bodyParser.json({limit: '10mb'}) );
app.use(cookieParser());
app.use(session({
  name: 'silex-session',
  secret: 'test session secret'
}));

// Build router options
// routes to expose unifile to CE front end
const routerOptions = {
  ftp: {
    redirectUri: rootUrl + '/ftp/signin',
  },
};

// Github service
console.log('Github service: looking for env vars GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
if(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  console.log('Github service: found app', process.env.GITHUB_CLIENT_ID);
  routerOptions.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: rootUrl + '/github/oauth_callback',
  };
}

// Dropbox service
console.log('Dropbox service: looking for env vars DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET');
if(process.env.DROPBOX_CLIENT_ID && process.env.DROPBOX_CLIENT_SECRET) {
  console.log('Dropbox service: found app', process.env.DROPBOX_CLIENT_ID);
  routerOptions.dropbox = {
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
    redirectUri: rootUrl + '/dropbox/oauth_callback',
  };
}

// Local file system service
console.log('Local file system service: looking for env vars SILEX_ELECTRON or SILEX_DEBUG');
if(process.env.SILEX_DEBUG || process.env.SILEX_ELECTRON) {
  console.info('Local file system service: ENABLED => local file system is writable');
  routerOptions.fs = {
    showHiddenFile: false,
    sandbox: Os.homedir(),
    infos: {
      displayName: 'fs',
    },
  };
}

// SSL
// force ssl if the env var SILEX_FORCE_HTTPS is set
if(process.env.SILEX_FORCE_HTTPS) {
  console.log('force SSL is active (env var SILEX_FORCE_HTTPS is set)');
  var forceSSL = require('express-force-ssl');
  app.set('forceSSLOptions', {
    trustXFPHeader: !!process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER
  });
  app.use(forceSSL);
}
else {
  console.log('force SSL NOT active (env var SILEX_FORCE_HTTPS is NOT set)');
}

// add static folders to serve silex files
app.use('/', serveStatic(Path.join(__dirname, '../../dist/client')));
// debug silex, for js source map
app.use('/js/src', serveStatic(Path.join(__dirname, '../../src')));
// the scripts which have to be available in all versions (v2.1, v2.2, v2.3, ...)
app.use('/static', serveStatic(Path.join(__dirname, '../../static')));

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
    https.createServer(options, app).listen(sslPort, function() {
      console.log('SSL: listening on port ', sslPort);
    });
  }
  catch(e) {
    console.warn('SSL: load certificate failed.', e)
  }
}

// create the routes for unifile
// needed by CE
const router = new Router(app, routerOptions);
initSilexTasks(app, router.unifile);

// Start Silex as an Electron app
if(process.env.SILEX_ELECTRON) {
  require(Path.join(__dirname, 'silex_electron'));
}

// server 'loop'
app.listen(port, function() {
  console.log('Listening on ' + port);
});


// ********************************
// list templates
// ********************************
app.use('/get/:folder', function(req, res, next){
  switch(req.params.folder) {
    case 'silex-templates':
    case 'silex-blank-templates':
      break;
    default:
      res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - folder does not exist'});
      return;
  }
  var templateFolder = Path.join(__dirname, '../../dist/client/libs/templates/', req.params.folder);
  fs.readdir(templateFolder, function(err, result) {
    if(err) {
      console.error('Error while trying to get the json representation of the folder ' + req.params.folder, err);
      res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - ' + err});
    } else {
      var templateList = result.filter(function(entry) {
        return fs.statSync(Path.join(templateFolder, entry)).isDirectory();
      });

      res.send(templateList);
    }
  });
});

