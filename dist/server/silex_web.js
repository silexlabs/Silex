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

'use strict';

const { SilexServer, DefaultConfig } = require('./index');
const config = new DefaultConfig();
// here you can change config,
// e.g. use config.publishRouterOptions.enableGithubPages
const silex = new SilexServer(config);
// here you can change routers,
// e.g. add unifile services `silex.unifile.use(unifileConnector)`
// and use `silex.app.get(...)` to add callbacks
// @see https://github.com/silexlabs/Silex/wiki/Silex-Developer-Guide#add-unifile-services-eg-for-hosting-companies

silex.start(function() {
  // console.log('server started');
});
