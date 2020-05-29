'use strict';

const { SilexServer, Config } = require('silex-website-builder');

// create a default config
const config = new Config();

// create the Silex server
const silex = new SilexServer(config);

// start Silex
silex.start(function() {
  console.log('server started');
})
