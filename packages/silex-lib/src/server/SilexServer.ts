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
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('cookie-session');

import CloudExplorerRouter from './router/CloudExplorerRouter';
import WebsiteRouter from './router/WebsiteRouter';
import StaticRouter from './router/StaticRouter';
import PublishRouter from './router/PublishRouter';
import SslRouter from './router/SslRouter';
import { Config } from './ServerConfig';

export default function SilexServer(config: Config) {
  if(config.serverOptions.debug) {
    require('source-map-support').install();
  }

  this.config = config;

  this.app = express();

  // compress gzip when possible
  this.app.use(compression());

  // cookie & session
  this.app.use(bodyParser.json({limit: '1mb'}));
  this.app.use(bodyParser.text({limit: '10mb'}));
  this.app.use(cookieParser());
  this.app.use(session({
    name: 'silex-session',
    secret: this.config.serverOptions.sessionSecret,
  }));

  // create the routes for unifile/CloudExplorer
  // and for Silex tasks
  this.staticRouter = StaticRouter(this.config.staticOptions);
  this.ceRouter = CloudExplorerRouter(this.config.ceOptions);
  this.websiteRouter = WebsiteRouter(this.config.serverOptions, this.ceRouter.unifile);
  this.publishRouter = PublishRouter(this.config.publisherOptions, this.ceRouter.unifile);
  this.sslRouter = SslRouter(this.config.sslOptions, this.app);
  this.unifile = this.ceRouter.unifile; // for access by third party
};

SilexServer.prototype.start = function(cbk) {
  // use routers
  this.app.use(this.config.serverOptions.cePath, this.ceRouter);
  this.app.use(this.staticRouter);
  this.app.use(this.websiteRouter);
  this.app.use(this.publishRouter);
  this.app.use(this.sslRouter);

  // add static folders to serve published files
  this.app.use(this.staticRouter);

  // Start Silex as an Electron app
  if(this.config.electronOptions.enabled) {
    require(Path.join(__dirname, 'silex_electron'));
  }

  // server 'loop'
  this.app.listen(this.config.serverOptions.port, () => {
    console.info(`\nI'm ready, listening to port ${this.config.serverOptions.port}\n`);
    if(cbk) cbk();
  });
};
