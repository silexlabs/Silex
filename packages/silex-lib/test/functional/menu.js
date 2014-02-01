var assert = require('assert')
, expect = require('chai').expect
, helper = require('../helper.js');

if (!helper.checkParams()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

/**
 * helper function
 */
function testInsertElementOfType (type) {
  var newElement;

  it('should be able to insert a '+type+' element', function(done) {
    // create element from the menu
    helper.driver.findElement(helper.webdriver.By.className('menu-item-insert')).click();
    helper.driver.findElement(helper.webdriver.By.className('menu-item-insert-'+type)).click();

    // check insertion
    helper.driver.findElement(helper.webdriver.By.className('silex-selected')).then(function (htmlElement) {
      newElement = htmlElement;
      htmlElement.getAttribute('data-silex-type').then(function (attr) {
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



describe('Silex menu', function() {

before(function(done) {
  this.timeout(30000);
  helper.startSelenium(function (_) {
    // open silex
    helper.driver.get('http://localhost:6805/silex/index.html').then(function () {
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

////////////////////////////////////////
// edit menu
var newElement;
it('should copy the selected element to the clipboard', function(done) {
  // create element from the menu
  helper.driver.findElement(helper.webdriver.By.className('menu-item-insert')).click();
  helper.driver.findElement(helper.webdriver.By.className('menu-item-insert-text')).click();

  // check insertion
  helper.driver.findElement(helper.webdriver.By.className('silex-selected')).then(function (htmlElement) {
    newElement = htmlElement;
  });
  // copy element from the menu
  helper.driver.findElement(helper.webdriver.By.className('menu-item-edit')).click();
  helper.driver.findElement(helper.webdriver.By.className('menu-item-edit-copy-selection')).click();
  // check the clipboard
  helper.driver.executeScript('return silex.controller.ControllerBase.clipboard;').then(function (clipboard){
    if(clipboard && clipboard.innerHTML === newElement.innerHTML){
        done();
    }
    else{
        done('Selected element and clipboard do not match');
    }
  });
});
it('should paste the clipboard element', function(done) {
  // paste element from the menu
  helper.driver.findElement(helper.webdriver.By.className('menu-item-edit')).click();
  helper.driver.findElement(helper.webdriver.By.className('menu-item-edit-paste-selection')).click();
  // check the pasted element exist but is not the original selected element
  helper.driver.findElement(helper.webdriver.By.className('silex-selected')).then(function (htmlElement) {
    if (htmlElement === newElement){
      done('element in the clipboard was not inserted');
    }
    else if (htmlElement.innerHTML !== newElement.innerHTML
        || htmlElement.tagName !== newElement.tagName
        || htmlElement.style !== newElement.style
      ){
      done('the inserted element is not similar to the selection');
    }
    else{
      done();
    }
  });
});

////////////////////////////////////////
// insert menu
testInsertElementOfType('text');
testInsertElementOfType('html');
testInsertElementOfType('container');

after(function(done) {
   this.timeout(30000);
  // shut down selenium
  helper.stopSelenium(function () {
    done();
  });
});
});
