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
var pathModule = require('path');
var unifile = require('unifile');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var multipart = require('connect-multiparty');
var FSStore = require('connect-fs2')(session);
var http = require('http');
var https = require('https');
var fs = require('fs');

// init express
var app = express();

// gzip/deflate outgoing responses
var compression = require('compression');
app.use(compression());

// parse data for file upload
app.use('/', multipart({limit: '100mb'}));

// parse data for post and get requests
app.use('/', bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
}));
app.use('/', bodyParser.json({limit: '10mb'}));
app.use('/', cookieParser());

// get silex config
var silexConfig = unifile.defaultConfig;
if (fs.existsSync(pathModule.resolve(__dirname, 'config.js'))) {
  var obj = require(pathModule.resolve(__dirname, 'config.js'));
  for (var prop in obj) {
  silexConfig[prop] = obj[prop];
  }
}

// session management
var sessionFolder = process.env.SILEX_SESSION_FOLDER || pathModule.resolve(__dirname, '../sessions');
app.use('/', session({
  secret: silexConfig.sessionSecret,
  name: silexConfig.cookieName,
  resave: true,
  saveUninitialized: false,
  store: new FSStore({
    dir: sessionFolder
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// ********************************
// production / debug
// ********************************
/**
 * catch all errors to prevent nodejs server crash
 */
function onCatchError(err) {
  console.log('---------------------');
  console.error('---------------------', 'Caught exception: ', err, err.stack, '---------------------');
  console.log('---------------------');
}
if(process.env.SILEX_DEBUG) {
  // DEBUG ONLY
  console.warn('Running server in debug mode');
  // define users (login/password) wich will be authorized to access the www folder (read and write)
  silexConfig.www.USERS = {
    'admin': 'admin'
  };
  silexConfig.openPages.ENABLED = true;
}
else {
  // PRODUCTION ONLY
  console.warn('Running server in production mode');
  // catch all errors and prevent nodejs to crash, production mode
  process.on('uncaughtException', onCatchError);
  // reset debug
  silexConfig.www.USERS = {};
  silexConfig.openPages.ENABLED = false;
}

// ********************************
// unifile server
// ********************************

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

// change www root
silexConfig.www.ROOT = pathModule.resolve(__dirname, '../../dist/client');

// add static folders
silexConfig.staticFolders.push(
  // silex main site
  {
    path: pathModule.resolve(__dirname, '../../dist/client')
  },
  // debug silex, for js source map
  {
    name: '/js/src',
    path: pathModule.resolve(__dirname, '../../src')
  },
  // the scripts which have to be available in all versions (v2.1, v2.2, v2.3, ...)
  {
    name: '/static',
    path: pathModule.resolve(__dirname, '../../static')
  }
);

// open pages if defined
if(silexConfig.openPages) {
  silexConfig.openPages.ROOT = pathModule.resolve(__dirname, '../../open-pages/');
  silexConfig.openPages.SQLLITE_FILE = pathModule.resolve(__dirname, '../../open-pages/websites.sql');
  fs.mkdir(silexConfig.openPages.ROOT, null, function (error) {});
}

// github service
if(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  console.log(process.env.GITHUB_CLIENT_ID);
  silexConfig.github.client_id = process.env.GITHUB_CLIENT_ID;
  silexConfig.github.client_secret = process.env.GITHUB_CLIENT_SECRET;
}

// SSL certificate
try {
  var privateKey = fs.readFileSync(process.env.SILEX_SSL_PRIVATE_KEY || __dirname + '/../../privatekey.pem').toString();
  var certificate = fs.readFileSync(process.env.SILEX_SSL_CERTIFICATE || __dirname + '/../../certificate.pem').toString();

  var options = {
    key: privatekey,
    cert: certificate
  };
}
catch(e) {
  console.warn('SSL certificate failed.')
}

// use unifile as a middleware
app.use(silexConfig.apiRoot, unifile.middleware(express, app, silexConfig));

var port = process.env.PORT || 6805; // 6805 is the date of sexual revolution started in paris france 8-)
http.createServer(app).listen(port, function() {
  console.log('listening on port ', port);
});

// SSL certificate
if(process.env.SILEX_SSL_PRIVATE_KEY && process.env.SILEX_SSL_CERTIFICATE) {
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
      console.log('listening on port ', sslPort);
    });
  }
  catch(e) {
    console.warn('SSL certificate failed.', e)
  }
}
// ********************************
// silex tasks
// ********************************

var silexTasks = require('./silex-tasks.js');
app.use('/tasks/:task', function(req, res, next){
  try{
    silexTasks.route(function(result){
      if (!result) {
        result = {success: true};
      }
      try{
         res.send(result);
      }
       catch(e){
        console.error('Error: header have been sent?', e, result, e.stack);
      }
    }, req, res, next, req.params.task);
  }
  catch(e){
    console.error('Error while executing task', e, e.stack);
  }

});
