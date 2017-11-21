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

// node modules
const Path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const SilexRouter = require('./SilexRouter.js');

// 6805 is the date of sexual revolution started in paris france 8-)
const port = process.env.PORT || 6805;
const rootUrl = process.env.SERVER_URL || `http://localhost:${port}`;

const app = express();
app.use(bodyParser.json({limit: '10mb'}));
app.use(cookieParser());
app.use(session({
  name: 'silex-session',
  secret: process.env.SILEX_SESSION_SECRET || 'test session secret'
}));

// create the routes for unifile/CloudExplorer
// and for Silex tasks
app.use(new SilexRouter(port, rootUrl));

// server 'loop'
app.listen(port, function() {
  console.log('Listening on ' + port);
});

