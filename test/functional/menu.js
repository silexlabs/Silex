var assert = require('assert')
, expect = require('chai').expect
, helper = require('../helper.js');

/**
 * helper function
 */
function testInsertElementOfType (type, opt_type_attr) {
    var newElement;

    if (!opt_type_attr) opt_type_attr = 'data-silex-sub-type';

    it('should be able to insert a '+type+' element', function(done) {
        // create element from the menu
        helper.driver.findElement(helper.webdriver.By.className('menu-item-insert')).click();
        helper.driver.findElement(helper.webdriver.By.className('menu-item-insert-'+type)).click();

        // check insertion
        helper.driver.findElement(helper.webdriver.By.className('silex-selected')).then(function (htmlElement) {
            newElement = htmlElement;
            htmlElement.getAttribute(opt_type_attr).then(function (attr) {
                if (attr == type) done();
                else done('element does not exist or is not of the correct type');
            });
        });
    });
    it('the element should be visible', function(done) {
        // check visibility
        newElement.isDisplayed().then(function (isDisplayed) {
            if (isDisplayed) done();
            else done('element is not visible');
            return isDisplayed;
        });
    });
}




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

testInsertElementOfType('text');
testInsertElementOfType('html');
testInsertElementOfType('container', 'data-silex-type');

after(function(done) {
   this.timeout(30000);
    // shut down selenium
    helper.stopSelenium(function () {
        done();
    });
});
});
