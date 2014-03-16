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

/**
 * helper function to test insertion of an element of the given type
 */
function testInsertElementOfType (type) {
  var newElement;

  it('should be able to insert a '+type+' element', function(done) {
    insertElement(type).then(function (htmlElement) {
      newElement = htmlElement;
      htmlElement.getAttribute('data-silex-type').then(function (attr) {
        if (attr == type) done();
        else done('element does not exist or is not of the correct type');
      });
    });
  });
  it('should be visible', function(done) {
    // check visibility
    newElement.isDisplayed().then(function (isDisplayed) {
      if (isDisplayed) done();
      else done('element is not visible');
      return isDisplayed;
    });
  });
}
/**
 * helper function to insert an element of the given type and return it
 */
function insertElement (type) {
  // create element from the menu
  driver.findElement(webdriver.By.className('menu-item-insert')).click();
  driver.findElement(webdriver.By.className('menu-item-insert-'+type)).click();
  // check insertion
  //return driver.executeScript('return document.getElementsByClassName("silex-selected")[0];');
  return driver.findElement(webdriver.By.className('silex-selected'));
}



describe('Silex menu', function() {

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

////////////////////////////////////////
// insert menu
it('should create a new page', function(done) {
  this.timeout(15000);
  // insert a new element
  insertElement('html');
  // open the text editor
  driver.findElement(webdriver.By.className('menu-item-insert')).click();
  driver.findElement(webdriver.By.className('menu-item-insert-page')).click().then(function(){
    // wait for alertify to appear
    // FIXME use wait instead of setTimeout
    setTimeout(function () {
      // type text
      driver.findElement(webdriver.By.className('alertify-text')).click().then(function(){
        var input = driver.switchTo().activeElement();
        input.sendKeys('\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\bTEST ?@~!. PAGE');
        // press ok
        driver.findElement(webdriver.By.id('alertify-ok')).click().then(function(){
          // wait for silex to apply changes
          // FIXME use wait instead of setTimeout
          setTimeout(function () {
            done();
          }, 1000);
        });
      });
    }, 1000);
  });
});
it('should contain the new text', function(done) {
  driver.executeScript('return $("a#page-test-page") && $("a#page-test-page").html() && $("a#page-test-page").html().indexOf("TEST ?@~!. PAGE") >= 0;').then(function (isUpdated){
    if(isUpdated){
      done();
    }
    else{
      done('page not found in the DOM');
    }
  });
});
testInsertElementOfType('text');
testInsertElementOfType('html');
testInsertElementOfType('container');
////////////////////////////////////////
// view menu
it('should edit the site CSS in the CSS editor', function(done) {
  // open the text editor
  driver.findElement(webdriver.By.className('menu-item-view')).click();
  driver.findElement(webdriver.By.className('menu-item-view-open-cssEditor')).click();
  // type text
  var input = driver.switchTo().activeElement();
  input.sendKeys('FUNCTIONAL_TESTS_CONTENT');
  // close the editor
  driver.findElement(webdriver.By.className('css-editor-close-btn')).click().then(function(){
    // wait for silex to apply changes
    setTimeout(function () {
      done();
    }, 800);
  });
});
it('should contain the new text', function(done) {
  driver.executeScript('return silex.main_silex_app.model.head.getHeadStyle().indexOf("FUNCTIONAL_TESTS_CONTENT") >= 0;').then(function (isUpdated){
    if(isUpdated){
      done();
    }
    else{
      done('CSS was not updated with the style tag');
    }
  });
});
it('should edit the site js script in the script editor', function(done) {
  // open the text editor
  driver.findElement(webdriver.By.className('menu-item-view')).click();
  driver.findElement(webdriver.By.className('menu-item-view-open-jsEditor')).click();
  // type text
  var input = driver.switchTo().activeElement();
  input.sendKeys('FUNCTIONAL_TESTS_CONTENT');
  // close the editor
  driver.findElement(webdriver.By.className('js-editor-close-btn')).click().then(function(){
    // wait for silex to apply changes
    setTimeout(function () {
      done();
    }, 800);
  });
});
it('should contain the new text', function(done) {
  driver.executeScript('return silex.main_silex_app.model.head.getHeadScript().indexOf("FUNCTIONAL_TESTS_CONTENT") >= 0;').then(function (isUpdated){
    if(isUpdated){
      done();
    }
    else{
      done('JS was not updated with the script tag');
    }
  });
});

////////////////////////////////////////
// edit menu
it('should copy the selected element to the clipboard', function(done) {
  this.timeout(3000);
  insertElement('text');
  // set a specific class name and content to the selected element
  driver.executeScript('$(".silex-selected").addClass("FUNCTIONAL_TESTS_CSS_CLASS");');
  driver.executeScript('$(".silex-selected .silex-element-content").html("FUNCTIONAL_TESTS_CONTENT")');
  // copy element from the menu
  driver.findElement(webdriver.By.className('menu-item-edit')).click();
  driver.findElement(webdriver.By.className('menu-item-edit-copy-selection')).click();
  // check the clipboard
  driver.executeScript('return silex.controller.ControllerBase.clipboard && $(silex.controller.ControllerBase.clipboard).hasClass("FUNCTIONAL_TESTS_CSS_CLASS") && $(silex.controller.ControllerBase.clipboard).html().indexOf("FUNCTIONAL_TESTS_CONTENT") > 0;').then(function (isAClone){
    if(isAClone){
        done();
    }
    else{
        done('Selected element and clipboard do not match');
    }
  });
});
it('should paste the clipboard element', function(done) {
  // set a specific class name and content to the selected element
  driver.executeScript('$(".silex-selected").removeClass("FUNCTIONAL_TESTS_CSS_CLASS");');
  driver.executeScript('$(".silex-selected .silex-element-content").html("OTHER_CONTENT")');
  // paste element from the menu
  driver.findElement(webdriver.By.className('menu-item-edit')).click();
  driver.findElement(webdriver.By.className('menu-item-edit-paste-selection')).click();
  // check the pasted element exist but is not the original selected element
  driver.executeScript('return $(".silex-selected").hasClass("FUNCTIONAL_TESTS_CSS_CLASS") && $(".silex-selected").html().indexOf("FUNCTIONAL_TESTS_CONTENT") > 0;').then(function (isAClone){
    if(isAClone){
        done();
    }
    else{
      done('element in the clipboard was not inserted');
    }
  });
});

it('should edit a text element in the text editor', function(done) {
  // insert a new element
  insertElement('text');
  // open the text editor
  driver.findElement(webdriver.By.className('menu-item-edit')).click();
  driver.findElement(webdriver.By.className('menu-item-view-open-textEditor')).click();
  // type text
  driver.switchTo().frame('text-editor');
  var input = driver.switchTo().activeElement();
  input.sendKeys('FUNCTIONAL_TESTS_CONTENT');
  driver.switchTo().defaultContent();
  // close the editor
  driver.findElement(webdriver.By.className('text-editor-close-btn')).click().then(function(){
    // wait for silex to apply changes
    setTimeout(function () {
      done();
    }, 200)
  });
});
it('should should contain the new text', function(done) {
  driver.executeScript('return $(".silex-selected").html().indexOf("FUNCTIONAL_TESTS_CONTENT") > 0;').then(function (isUpdated){
    if(isUpdated){
      done();
    }
    else{
      done('element was not updated with the new text');
    }
  });
});
it('should edit an html element in the HTML editor', function(done) {
  this.timeout(4000);
  // insert a new element
  insertElement('html');
  // open the text editor
  driver.findElement(webdriver.By.className('menu-item-edit')).click();
  driver.findElement(webdriver.By.className('menu-item-view-open-textEditor')).click();
  // type text
  var input = driver.switchTo().activeElement();
  input.sendKeys('FUNCTIONAL_TESTS_CONTENT');
  // close the editor
  driver.findElement(webdriver.By.className('html-editor-close-btn')).click().then(function(){
    // wait for silex to apply changes
    setTimeout(function () {
      done();
    }, 800);
  });
});
it('should contain the new text', function(done) {
  driver.executeScript('return $(".silex-selected").html().indexOf("FUNCTIONAL_TESTS_CONTENT") > 0;').then(function (isUpdated){
    if(isUpdated){
      done();
    }
    else{
      done('element was not updated with the new text');
    }
  });
});


////////////////////////////////////
// end of tests
after(function(done) {
   this.timeout(30000);
  // shut down selenium
  helper.stopSelenium(function () {
    done();
  });
});
});
