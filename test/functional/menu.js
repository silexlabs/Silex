var assert = require('assert')
, expect = require('chai').expect
, helper = require('../helper.js');

describe('Silex insert menu', function() {

before(function(done) {
    this.timeout(30000);
    helper.startSelenium(function (_) {
        // open silex
        helper.driver.get('http://localhost:6805/silex/debug.html').then(function () {
            done();
        });
    });
});
it('should wait to load', function(done) {
    this.timeout(3000);
    // wait for silex to be loaded
    setTimeout(function () {
        done();
    }, 2000)
});
it('should be able to insert an element', function(done) {
    // click
    helper.driver.findElement(helper.webdriver.By.className('menu-item-insert')).click();
    helper.driver.findElement(helper.webdriver.By.className('menu-item-insert-text')).click();
    // check insertion
    helper.driver.findElement(helper.webdriver.By.className('silex-selected')).isDisplayed().then(function (isDisplayed) {
        if (isDisplayed) done();
        else done('element is not visible');
        return isDisplayed;
    });
});
after(function(done) {
   this.timeout(30000);
    // shut down selenium
    helper.stopSelenium(function () {
        done();
    });
});
});
