var fs = require('fs')
, path = require('path'); 

/**
 * ref to selenium driver
 */
exports.driver = null;
exports.webdriver = null;

/**
 * start Silex server once
 */
var silexServer = require('../dist/server/server.js');
console.log('-----');
console.log('Silex start');
console.log('-----');
silexServer.setDebugMode(true);

/**
 * start selenium driver
 * @param        cbk         callback which takes the selenium driver in param
 */
exports.startSelenium = function (cbk) {
    if (exports.driver){
            console.warn('selenium already started, restart');
            exports.stopSelenium(function () {
                    startSelenium(cbk);
            });
            return;
    }
    // get command line args to det which driver to call
    var driverName = null;
    for (var i in process.argv){
        var val = process.argv[i];
        if (val == '-firefox'){
            driverName = 'firefox';
        }
        else if (val == '-chrome'){
            driverName = 'chrome';
        }
        else if (val == '-phantomjs'){
            driverName = 'phantomjs';
        }
    }
    if (!driverName){
        console.warn('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Assuming \'phantomjs\'.');
        driverName = 'phantomjs';
    }
    // start selenium
    exports.webdriver = require('selenium-webdriver'),
        SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;

    if (!fs.existsSync(__dirname+'/selenium-server-standalone-2.37.0.jar')) throw new Error('The standalone Selenium server is needed in '+__dirname+'/selenium-server-standalone-2.37.0.jar');
    var server = new SeleniumServer(__dirname+'/selenium-server-standalone-2.37.0.jar', {
      port: 4444
    });

    server.start();

    // select driver
    var capabilities;
    if (driverName==='phantomjs'){
        var phantomjs = require('phantomjs');

        // with phantom js
        capabilities = exports.webdriver.Capabilities.phantomjs();
        capabilities.set('phantomjs.binary.path', phantomjs.path);
    }
    else if (driverName==='firefox'){
        // with firefox (which must be installed)
        capabilities = exports.webdriver.Capabilities.firefox();
    }
    else if (driverName==='chrome'){
        // with firefox (which must be installed)
        capabilities = exports.webdriver.Capabilities.chrome();
        var exePath = path.resolve(__dirname, '..');
        if (!fs.existsSync(exePath+'/chromedriver')) throw new Error('Chrome driver for selenium is needed in '+exePath);
    }

    // build
    exports.driver = new exports.webdriver.Builder().
        usingServer(server.address()).
        withCapabilities(capabilities).
        build();

    if (cbk) cbk(exports.driver);
}
/**
 * stop selenium driver
 * @param        cbk         callback fired after shutdown
 */
exports.stopSelenium = function (cbk) {
        exports.driver.quit().then(function () {
                exports.driver = null;
                if (cbk) cbk();
        });
}