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
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const serveStatic = require('serve-static');
const CloudExplorerRouter = require('./CloudExplorerRouter');
const WebsiteRouter = require('./WebsiteRouter.js');
const PublishRouter = require('./PublishRouter.js');
const SslRouter = require('./SslRouter.js');
const bodyParser = require('body-parser');
const nodeModules = require('node_modules-path');

module.exports = function(options) {
  this.options = options;
  const {
    serverOptions,
    publisherOptions,
    ceOptions,
    electronOptions,
    sslOptions,
  } = this.options;

  this.app = express();

  // compress gzip when possible
  this.app.use(compression());

  // cookie & session
  this.app.use(bodyParser.json({limit: '1mb'}));
  this.app.use(bodyParser.text({limit: '10mb'}));
  this.app.use(cookieParser());
  this.app.use(session({
    name: 'silex-session',
    secret: serverOptions.sessionSecret,
  }));

  // create the routes for unifile/CloudExplorer
  // and for Silex tasks
  this.ceRouter = new CloudExplorerRouter(ceOptions);
  this.websiteRouter = new WebsiteRouter(serverOptions, this.ceRouter.unifile);
  this.publishRouter = new PublishRouter(publisherOptions, this.ceRouter.unifile);
  this.sslRouter = new SslRouter(sslOptions, this.app);
  this.unifile = this.ceRouter.unifile; // for access by third party
};

module.exports.prototype.start = function(cbk) {
  const {
    serverOptions,
    publisherOptions,
    ceOptions,
    electronOptions,
    sslOptions,
  } = this.options;

  // use routers
  this.app.use(serverOptions.cePath, this.ceRouter);
  this.app.use(this.websiteRouter);
  this.app.use(this.publishRouter);
  this.app.use(this.sslRouter);

  // add static folders to serve silex files
  this.app.use('/', serveStatic(Path.join(__dirname, '../../dist/client')));
  // debug silex, for js source map
  this.app.use('/js/src', serveStatic(Path.join(__dirname, '../../src')));
  // the scripts which have to be available in all versions (v2.1, v2.2, v2.3, ...)
  this.app.use('/static', serveStatic(Path.join(__dirname, '../../static')));
  // wysihtml
  this.app.use('/libs/wysihtml', serveStatic(Path.resolve(nodeModules('wysihtml'), 'wysihtml/parser_rules')));
  this.app.use('/libs/wysihtml', serveStatic(Path.resolve(nodeModules('wysihtml'), 'wysihtml/dist/minified')));
  // templates
  this.app.use('/libs/templates/silex-templates', serveStatic(Path.resolve(nodeModules('silex-templates'), 'silex-templates')));
  this.app.use('/libs/templates/silex-blank-templates', serveStatic(Path.resolve(nodeModules('silex-blank-templates'), 'silex-blank-templates')));
  this.app.use('/libs/prodotype', serveStatic(Path.resolve(nodeModules('prodotype'), 'prodotype/pub')));

  // Start Silex as an Electron app
  if(electronOptions.enabled) {
    require(Path.join(__dirname, 'silex_electron'));
  }

  // server 'loop'
  this.app.listen(serverOptions.port, function() {
    console.log('Listening on ' + serverOptions.port);
    if(cbk) cbk();
  });
};

