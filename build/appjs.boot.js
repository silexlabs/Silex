// load appjs

var appjs = require('appjs');

// create a window
var window = appjs.createWindow({
  width: 640,
  height: 460,
  alpha: false,
});

// prepare the window when first created
window.on('create', function(){
  console.log("Window Created");
  // window.frame controls the desktop window
  window.frame.show().center();
});

// the window is ready when the DOM is loaded
window.on('ready', function(){
  console.log("Window Ready");
  // directly interact with the DOM
  window.process = process;
  window.module = module;

  window.addEventListener('keydown', function(e){
    // show chrome devtools on f12 or commmand+option+j
    if (e.keyIdentifier === 'F12' || e.keyCode === 74 && e.metaKey && e.altKey) {
      window.frame.openDevTools();
    }
  });
});

// cleanup code when window is closed
window.on('close', function(){
  console.log("Window Closed");
});


/**
 * A simple unifile server to expose unifile api and nothing else
 * https://github.com/silexlabs/unifile/
 * license: GPL v2
 */
// node modules
var express = require('express');
var app = express();
var unifile = require('unifile');

// config
var options = unifile.defaultConfig;

// change www root
options.www.root = "../../../../www";

// DEBUG ONLY
// define users (login/password) wich will be authorized to access the www folder (read and write)
/*
options.www.users = {
    "admin": "admin"
}
*/
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
    // silex editor
    {
        name: "/silex",
        path: "../../../../dist/client/"
    },
    // debug silex
    {
        name: "/src",
        path: "../../../../src/"
    },
    {
        name: "/build",
        path: "../../../../build/"
    }
);

// use unifile as a middleware
app.use(unifile.middleware(express, app, options));

// server 'loop'
var port = process.env.PORT || 6805; // 6805 is the date of sexual revolution started in paris france 8-)
app.listen(port, function() {
  console.log('Listening on ' + port);
});

// catch all errors and prevent nodejs to crash, production mode
process.on('uncaughtException', function(err) {
    console.log  ('---------------------');
    console.error('---------------------', 'Caught exception: ', err, '---------------------');
    console.log  ('---------------------');
});
