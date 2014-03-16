var assert = require('assert')
, expect = require('chai').expect
, helper = require('../helper.js');

// store the driver and webdriver instances
// created by the helper.js methods
var driver, webdriver;

// check command line input params
if (!helper.checkParams()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

describe('Silex dialogs', function() {

before(function(done) {
  this.timeout(60000);
  helper.startSelenium(function (helperDriver, helperWebdriver) {
    driver = helperDriver;
    webdriver = helperWebdriver;
    // open silex
    driver.get('http://localhost:6805/silex/').then(function () {
      done();
    });
  });
});
it('should be able to load', function() {
  // wait for silex to be loaded
  driver.wait(function() {
    return driver.findElement(webdriver.By.className('background')).isDisplayed();
  }, 2000);
});
it('should be able to open the file explorer dialog', function(done) {
  // click file menu
  driver.findElement(webdriver.By.className('menu-item-file')).click()
  // Fixme: timer is needed, but I do not understand why (the menu seems visible)
  // for phantomjs only
  driver.sleep(500);
  // now click on open in the menu
  driver.findElement(webdriver.By.className('menu-item-file-open')).click();
  // check visibility
  driver.findElement(webdriver.By.className('silex-fileexplorer')).isDisplayed().then(function (isDisplayed) {
    if (isDisplayed){
      // file explorer is displayed
      done();
    }
    else {
      done('File explorer dialog is not visible');
    }
  });
});
it('should open the login popup', function(done) {
  console.log('should open the login popup');
  // keep reference to Silex main window
  var originWindow = driver.getWindowHandle();
  // click the www image
  driver.findElements(webdriver.By.css('.ce-left-pane .tree .ng-scope .ce-folder')).then(function (elements) {
    elements[1].click();
  });
  // click on the "click here" button to open the login window
  //  driver.findElement(webdriver.By.linkText("CLICK HERE")).click().then(function (findElement) {
  driver.findElement(webdriver.By.css(".authPopup>div")).click().then(function () {
    console.log('should login');
    // now login in auth popup
    driver.switchTo().window('authPopup');
    var input = driver.findElement(webdriver.By.name('username'));
    input.sendKeys('admin');
    input = driver.findElement(webdriver.By.name('password'));
    input.sendKeys('admin');
    driver.findElement(webdriver.By.xpath('//input[@type="submit"]')).click();
    // back to main window
    driver.switchTo().window(originWindow).then(function () {
      console.log('done');
      done();
    });
  }, function (err) {
    // already logged in
    console.log('already logged in', err);
  });
});
return;
it('should be able to close the file explorer dialog', function(done) {
  console.log('should be able to close the file explorer dialog');
  // click on close
  var closeBtn;
  if (helper.getDriverName() === 'phantomjs') {
    // FIXME: do not work in chrome
    closeBtn = driver.findElement(webdriver.By.className('dialogs-background'));
  }
  else {
    // Fixme: timer is needed, but I do not understand why
    // for chrome only (use of wait will not help here)
    driver.sleep(500);
    // FIXME: do not work in phantomjs
    closeBtn = driver.findElement(webdriver.By.css('.silex-fileexplorer .close-btn'));
  }
  closeBtn.click();
  // check visibility
  driver.findElement(webdriver.By.className('silex-fileexplorer'))
  .isDisplayed()
  .then(function (isDisplayed) {
    console.log('should be able to close the file explorer dialog 2', isDisplayed);
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
