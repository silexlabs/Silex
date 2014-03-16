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

describe('Silex file operations', function() {

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

it('should be able to make a publication with basic elements', function(done) {
  // create elements
  var script = "\
  var element;\
  silex.main_silex_app.controller.menuController.menuCallback('insert.html');\
  element = silex.main_silex_app.view.stage.getSelection()[0];\
  element.className += ' tmp-test-html';\
  silex.main_silex_app.model.element.setInnerHtml(element, 'FUNCTIONAL_TESTS_CONTENT');\
  \
  silex.main_silex_app.controller.menuController.menuCallback('insert.text');\
  element = silex.main_silex_app.view.stage.getSelection()[0];\
  element.className += ' tmp-test-text';\
  silex.main_silex_app.model.element.setInnerHtml(element, 'FUNCTIONAL_TESTS_CONTENT');\
  \
  silex.main_silex_app.controller.menuController.menuCallback('insert.text');\
  element = silex.main_silex_app.view.stage.getSelection()[0];\
  element.className += ' tmp-test-text2';\
  silex.main_silex_app.model.element.setInnerHtml(element, 'FUNCTIONAL_TESTS_CONTENT');\
  \
  element = silex.main_silex_app.controller.menuController.menuCallback('insert.container');\
  element = silex.main_silex_app.view.stage.getSelection()[0];\
  element.className += ' tmp-test-container';\
  \
  ";
  driver.executeScript(script).then(function (){
  driver.findElement(webdriver.By.className('tmp-test-container')).then(function (container){
    driver.findElement(webdriver.By.className('tmp-test-text2')).then(function (text){
    // drag text element 2 into the container
    new webdriver.ActionSequence(driver).
      // move the container
      mouseMove(container).mouseMove({x:50, y:50}).mouseDown().mouseMove({x:400, y:400}).mouseUp().
      // make it bigger
      dragAndDrop(container, {x:-200, y:-200}).
      // move the text into the container
      mouseMove(text).mouseMove({x:50, y:50}).mouseDown().mouseMove(container).mouseMove({x:50, y:50}).mouseUp().
      perform().then(function () {
      // check the dom has the correct elements
      var scripts = [];
      scripts.push({
        name: 'html',
        script: "var element;\
        var isOk = true;\
        element = goog.dom.getElementByClass('tmp-test-html');\
        console.log('isOk=', isOk);\
        isOk = isOk && element && element.innerHTML.indexOf('FUNCTIONAL_TESTS_CONTENT') >= 0;\
        console.log('isOk=', isOk);\
        return isOk;"
      });
      scripts.push({
        name: 'text',
        script: "var element;\
        var isOk = true;\
        element = goog.dom.getElementByClass('tmp-test-text');\
        isOk = isOk && element && element.innerHTML.indexOf('FUNCTIONAL_TESTS_CONTENT') >= 0;\
        console.log('isOk=', isOk);\
        return isOk;"
      });
      scripts.push({
        name: 'text2',
        script: "var element;\
        var isOk = true;\
        element = goog.dom.getElementByClass('tmp-test-text2');\
        isOk = isOk && element && element.innerHTML.indexOf('FUNCTIONAL_TESTS_CONTENT') >= 0;\
        console.log('isOk=', isOk);\
        return isOk;"
      });
      scripts.push({
        name: 'container',
        script: "var element;\
        var isOk = true;\
        element = goog.dom.getElementByClass('tmp-test-container');\
        isOk = isOk && element && goog.dom.contains(element, goog.dom.getElementByClass('tmp-test-text2'));\
        console.log('isOk=', isOk);\
        return isOk;"
      });

      var namesWithErrors = [];
      for(var idx in scripts){
        var numScripts = scripts.length;
        var script = scripts[idx].script;
        var name = scripts[idx].name;
        driver.executeScript(script).then(function (isOk){
        console.log('script done ', name, isOk);
        if (isOk){
          // last script => done
          if (numScripts === 0)
          done();
        }
        else{
          console.log('Dom is not like it should (', name,')');
          namesWithErrors.push(name);
        }
        numScripts--;
        });
      }
      if (namesWithErrors.length > 0){
        done('Dom is not like it should (' + namesWithErrors.join(', ') + ')');
      }
      else{
        done();
      }
      });
    });
  });
  });
});
/* */
it('should be able to save the file', function(done) {
  this.timeout(15000);
  // open the file menu
  driver.findElement(webdriver.By.className('menu-item-file')).click();
  // Fixme: timer is needed, but I do not understand why (the menu seems visible)
  // for phantomjs only
  driver.sleep(500);
  // click save menu item
  driver.findElement(webdriver.By.className('menu-item-file-save')).click();

  var doAfterLoggedIn = function (done) {
    // Fixme: timer is needed, but I do not understand why
    driver.sleep(500);
    // type a name
    if (helper.getDriverName() === 'phantomjs') {
      // FIXEME: do not work in chrome
      driver.findElement(webdriver.By.css('.ce-saveas-btn'))
      .sendKeys('\t\t\t\ttmp-test-files');
    }
    else {
      // FIXEME: do not work in phantomjs
      driver.findElement(webdriver.By.css('.ce-saveas-btn input'))
      .sendKeys('tmp-test-files');
    }
    // click ok
    driver.findElement(webdriver.By.xpath('//button[@ng-click="saveAs(saveAsName)"]')).click().then(function () {
      console.log('save done');
      done();
    });
  };
  // click the www image
  driver.findElements(webdriver.By.css('.ce-left-pane .tree .ng-scope .ce-folder')).then(function (elements) {
    elements[1].click();
  });
  // click on the "click here" button to open the login window
  //  driver.findElement(webdriver.By.linkText("CLICK HERE")).click().then(function (findElement) {
  driver.findElement(webdriver.By.css(".authPopup>div")).click().then(function () {
    // login
    var originWindow = driver.getWindowHandle();
    // now login in auth popup
    driver.switchTo().window('authPopup');
    var input = driver.findElement(webdriver.By.name('username'));
    input.sendKeys('admin');
    input = driver.findElement(webdriver.By.name('password'));
    input.sendKeys('admin');
    driver.findElement(webdriver.By.xpath('//input[@type="submit"]')).click();
    // back to main window
    driver.switchTo().window(originWindow).then(function () {
      doAfterLoggedIn(done);
    });
  }, function (err) {
    // already logged in
    console.log('already logged in', err);
    doAfterLoggedIn(done);
  });
});
/* */
after(function(done) {
  this.timeout(60000);
  // shut down selenium
  helper.stopSelenium(function () {
    done();
  });
});
/* */
});
