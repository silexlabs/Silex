var assert = require('assert')
, silexServer = require('../../server/api-server.js')
, webdriver = require('selenium-webdriver')
, expect = require('chai').expect;

/* */
//////////////////////////////////////////
// ChromeDriver
var driver = new webdriver.Builder().
   withCapabilities(webdriver.Capabilities.chrome()).
   build();
/* *
// Stand-alone Selenium Server
var webdriver = require('selenium-webdriver'),
    SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;

var server = new SeleniumServer('selenium-server-standalone-2.37.0.jar', {
  port: 4444
});

server.start();

var driver = new webdriver.Builder().
    usingServer(server.address()).
    withCapabilities(webdriver.Capabilities.firefox()).
    build();
/* */
// write text
//driver.findElement(webdriver.By.name('q')).sendKeys('webdriver');
//////////////////////////////////////////
// the tests

describe('Silex', function() {

before(function(done) {
    // open silex
    driver.get('http://localhost:6805/silex/debug.html').then(function () {
        done();
    });
});

it('should be able to view the home page', function(done) {
    this.timeout(10000);
    // wait for silex to be loaded
    setTimeout(function () {
        done();
    }, 5000)
});
it('should be able to open the file menu', function(done) {
    // click
    driver.findElement(webdriver.By.className('menu-item-file')).then(function (element) {
        element.click().then(function () {
            done();
        })
        return true;
    });
});
it('should be able to click the file/open menu', function(done) {
    // click
    driver.findElement(webdriver.By.className('menu-item-file-open')).then(function (element) {
        element.click().then(function () {
            done();
        })
        return true;
    });
});
it('should be able to open the open file dialog', function(done) {
    // check dialog
    driver.findElement(webdriver.By.className('silex-fileexplorer')).then(function (element) {
        // click, just to check that it is visible
        element.click().then(function () {
            done();
        });
        return true;
    });
});
after(function(done) {
    // open silex
    driver.quit().then(function () {
        done();
        return true;
    });
});
});