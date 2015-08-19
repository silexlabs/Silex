// docs:
// * https://code.google.com/p/selenium/source/browse/javascript/webdriver/webdriver.js
// * http://selenium.googlecode.com/git/docs/api/javascript/namespace_webdriver.html

var fs = require('fs')
, path = require('path')
, webdriverio = require('webdriverio');

/**
 * ref to selenium driver
 */
exports.webdriver = null;

/**
 * start Silex server once
 */
var silexServer = require('../dist/server/server.js');
console.log('------');
console.log('Silex start');
console.log('------');

/**
 * check if we will be able to start selenium driver
 * @return  true if it's ok
 */
exports.checkParams = function () {
  if (exports.getDriverName() !== null){
    return true;
  }
  return false;
}


/**
 * get the driver name from the input params
 * @return  the driver name (phantomjs, firefox...)
 */
exports.getDriverName = function () {
    // get command line args to det which driver to call
    var driverName = null;
    for (var i in process.argv){
        var val = process.argv[i];
        if (val == '--firefox'){
            driverName = 'firefox';
        }
        else if (val == '--chrome'){
            driverName = 'chrome';
        }
        else if (val == '--phantomjs'){
            driverName = 'phantomjs';
        }
    }
    return driverName;
}


/**
 * create the webdriver client
 */
exports.createClient = function () {

    var rootPath = path.resolve(__dirname, '..');
    var phantomjsPath = rootPath + '/node_modules/phantomjs/bin/phantomjs';

    var driverName = exports.getDriverName();
    if (driverName){

    if (driverName==='firefox'){
      // with firefox (which must be installed)
    }
    else if (driverName==='chrome'){
      if (!fs.existsSync(rootPath+'/chromedriver')) {
        throw new Error('Chrome driver for selenium is needed in '+rootPath);
      }
    }

    var client = webdriverio.remote({
      desiredCapabilities: {
        browserName: driverName
        , 'phantomjs.binary.path': phantomjsPath
      }
    });
    client.init().windowHandleSize({width: 1024, height: 768});
    client.on('error', function(e) {
      // happens all the time, when waiting for timeout for example (.waitFor('.not-exist', 2000, _))
      // console.error('an error occured in the client connected to the selenium server', e)
      if (e && e.err && e.err.code){
        switch(e.err.code) {
          case 'ECONNREFUSED':
            console.error("couldn't connect to selenium server, please run the command: \n $ node_modules/.bin/selenium");
          break;
        }
      }
    });
    return client;
  }
  console.error('You are supposed to call mocha with param \'--firefox\', \'--chrome\' or \'--phantomjs\'. Canceling tests.');
  return null;
}
