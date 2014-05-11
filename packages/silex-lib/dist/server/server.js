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

// newrelic debug tool
require('newrelic');

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
app.use('/silex/tasks', multipart());

// parse data for post data
app.use('/silex/tasks', bodyParser());

// start session
app.use('/silex/tasks', cookieParser());
app.use('/silex/tasks', cookieSession({ secret: 'plum plum plum'}));

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
            "admin": "admin"
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
options.www.ROOT = "../../../../www";

// add static folders
options.staticFolders.push(
    // file browser
    {
            name: "/cloud-explorer",
            path: "../../../../submodules/cloud-explorer/lib/"
    },
    // silex main site
    {
        path: "../../../../www/"
    },
    // debug silex, for js source map
    {
        name: "/silex/js/src",
        path: "../../../../src/"
    },
    // debug silex, for offline work
    {
        name: "/static.silex.me",
        path: "../../../../static.silex.me/"
    },
    // silex editor
    {
        name: "/silex",
        path: "../../../../dist/client/"
    },
    {
        name: "/build",
        path: "../../../../build/"
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

app.post('/silex/tasks/:task', function(req, res, next){
    var silexTasks = require('./silex-tasks.js');
    silexTasks.route(function(result){
        if (!result) result = {success:true};
        console.log('silex task result', result);
        res.send(result);
    }, req, res, next, req.params.task);
});
