var assert = require('assert')
, expect = require('chai').expect
, helper = require('../helper.js');

if (!helper.checkParams()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

describe('Silex file operations', function() {

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
  helper.driver.executeScript(script).then(function (){
    helper.driver.findElement(helper.webdriver.By.className('tmp-test-container')).then(function (container){
      helper.driver.findElement(helper.webdriver.By.className('tmp-test-text2')).then(function (text){
        // drag text element 2 into the container
        new helper.webdriver.ActionSequence(helper.driver).
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
              helper.driver.executeScript(script).then(function (isOk){
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
  // save
  helper.driver.findElement(helper.webdriver.By.className('menu-item-file')).click();
  helper.driver.findElement(helper.webdriver.By.className('menu-item-file-save')).click();

  var doAfterLoggedIn = function (done) {
    // wait for the files to show up
    setTimeout(function () {
      // type a name
      helper.driver.findElement(helper.webdriver.By.className('ce-saveas-btn'))
        .findElement(helper.webdriver.By.tagName('input'))
        .sendKeys('tmp-test-files');
      // click ok
      helper.driver.findElement(helper.webdriver.By.xpath('//button[@ng-click="saveAs(saveAsName)"]')).click().then(function () {
        setTimeout(function () {
          console.log('done');
          done();
        }, 2000);
      });
    }, 2000);
  };

  // login
  var originWindow = helper.driver.getWindowHandle();
  // click
  helper.driver.findElement(helper.webdriver.By.css('img[title="Edit files on the server where Silex is installed."]')).click();
  helper.driver.findElement(helper.webdriver.By.linkText("CLICK HERE")).click().then(function (findElement) {
    // now login in auth popup
    helper.driver.switchTo().window('authPopup');
    var input = helper.driver.findElement(helper.webdriver.By.name('username'));
    input.sendKeys('admin');
    input = helper.driver.findElement(helper.webdriver.By.name('password'));
    input.sendKeys('admin');
    helper.driver.findElement(helper.webdriver.By.xpath('//input[@type="submit"]')).click();
    // back to main window
    helper.driver.switchTo().window(originWindow).then(function () {
      doAfterLoggedIn(done);
    });
  }, function (err) {
    // already logged in
    console.log('already logged in');
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
