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
var unifile = require('unifile');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var multipart = require('connect-multiparty');
var unifile = require('unifile');
var FSStore = require('connect-fs2')(session);

// init express
var app = express();

// gzip/deflate outgoing responses
var compression = require('compression')
app.use(compression())

// parse data for file upload
app.use('/', multipart({limit: '100mb'}));

// parse data for post and get requests
app.use('/', bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
}));
app.use('/', bodyParser.json({limit: '10mb'}));
app.use('/', cookieParser());

// session management
app.use('/', session({
  secret: unifile.defaultConfig.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: new FSStore({
    dir: __dirname + '/sessions'
  }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
}));

// ********************************
// production
// ********************************
var isDebug = false;
/**
 * catch all errors to prevent nodejs server crash
 */
function onCatchError(err) {
    console.log  ('---------------------');
    console.error('---------------------', 'Caught exception: ', err, '---------------------');
    console.log  ('---------------------');
}
/**
 * set debug or production modes
 */
exports.setDebugMode = function(debug){
    if(debug && !isDebug){
        process.removeListener('uncaughtException', onCatchError);

        // DEBUG ONLY
        console.warn('Running server in debug mode');
        // define users (login/password) wich will be authorized to access the www folder (read and write)
        options.www.USERS = {
            'admin': 'admin'
        }
    }
    if(!debug && isDebug){
        // PRODUCTION ONLY
        console.warn('Running server in production mode');
        // catch all errors and prevent nodejs to crash, production mode
        process.on('uncaughtException', onCatchError);
        // reset debug
        options.www.USERS = {};
    }
}
// ********************************
// config
// ********************************
var options = unifile.defaultConfig;

// change www root
options.www.ROOT = __dirname + '/../../dist/client';

// add static folders
options.staticFolders.push(
    // silex main site
    {
        path: __dirname + '/../../dist/client'
    },
    // debug silex, for js source map
    {
        name: '/js/src',
        path: __dirname + '/../../src'
    }
);

// get command line args
var debug = false;
for (var i in process.argv){
    var val = process.argv[i];
    if (val == '-debug') debug = true;
}

// debug or production mode
exports.setDebugMode(debug);

// ********************************
// unifile server
// ********************************
// use unifile as a middleware
app.use('/api', unifile.middleware(express, app, options));

// server 'loop'
var port = process.env.PORT || 6805; // 6805 is the date of sexual revolution started in paris france 8-)
app.listen(port, function() {
  console.log('Listening on ' + port);
});

// ********************************
// silex tasks
// ********************************

var silexTasks = require('./silex-tasks.js');
app.use('/tasks/:task', function(req, res, next){
    try{
        silexTasks.route(function(result){
            if (!result) result = {success:true};
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
