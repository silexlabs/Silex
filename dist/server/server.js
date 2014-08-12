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
var express = require('express')
    , bodyParser = require('body-parser')
    , cookieParser = require('cookie-parser')
    , cookieSession = require('cookie-session')
    , multipart = require('connect-multiparty');

var app = express();
var unifile = require('unifile');

// use express for silex tasks (has to be done before app.use(unifile.middleware(...))

// parse data for file upload
app.use('/tasks', multipart());

// parse data for post data
app.use('/tasks', bodyParser({
  limit: 10000000
}));

// start session
app.use('/tasks', cookieParser());
app.use('/tasks', cookieSession({ secret: 'plum plum plum'}));

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
app.use(unifile.middleware(express, app, options));

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
    silexTasks.route(function(result){
        if (!result) result = {success:true};
        console.log('silex task result', result);
        res.send(result);
    }, req, res, next, req.params.task);
});
