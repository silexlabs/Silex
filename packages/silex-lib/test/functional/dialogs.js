var assert = require('assert')
, expect = require('chai').expect
, helper = require('../helper.js');

if (!helper.checkParams()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

describe('Silex dialogs', function() {

before(function(done) {
    this.timeout(60000);
    helper.startSelenium(function (_) {
        // open silex
        helper.driver.get('http://localhost:6805/silex/').then(function () {
            done();
        });
    });
});
it('should be able to load', function(done) {

    this.timeout(3000);
    // wait for silex to be loaded
    setTimeout(function () {
        done();
    }, 2000)
});
it('should be able to open the file menu', function(done) {
    // click
    helper.driver.findElement(helper.webdriver.By.className('menu-item-file')).then(function (element) {
        element.click().then(function () {
            done();
        })
        return true;
    });
});
it('should be able to open the file explorer dialog', function(done) {
    // click
    helper.driver.findElement(helper.webdriver.By.className('menu-item-file-open')).click();
    // check visibility
    helper.driver.findElement(helper.webdriver.By.className('silex-fileexplorer')).isDisplayed().then(function (isDisplayed) {
        if (isDisplayed) done();
        else done('dialog is not visible');
        return isDisplayed;
    });
});
it('should open the login popup', function(done) {
    var originWindow = helper.driver.getWindowHandle();
    // click
    helper.driver.findElement(helper.webdriver.By.css('img[title="Edit files on the server where Silex is installed."]')).click();
    helper.driver.findElement(helper.webdriver.By.linkText("CLICK HERE")).click();
    // check visibility
    helper.driver.switchTo().window('authPopup');
    var input = helper.driver.findElement(helper.webdriver.By.name('username'));
    input.sendKeys('admin');
    input = helper.driver.findElement(helper.webdriver.By.name('password'));
    input.sendKeys('admin');
    input.sendKeys(String.fromCharCode('13'));
    helper.driver.switchTo().window(originWindow).then(function () {
      done();
    });
});
it('should be able to close the file explorer dialog', function(done) {
    // click on close
    helper.driver.findElement(helper.webdriver.By.className('silex-fileexplorer'))
    .findElement(helper.webdriver.By.className('close-btn'))
    .click();
    // check visibility
    helper.driver.findElement(helper.webdriver.By.className('silex-fileexplorer'))
    .isDisplayed()
    .then(function (isDisplayed) {
        if (!isDisplayed){
          done();
        }
        else {
          done('dialog is still visible');
        }
    });
});
after(function(done) {
   this.timeout(60000);
    // shut down selenium
    helper.stopSelenium(function () {
        done();
    });
});
});
