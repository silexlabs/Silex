var webdriverjs = require('webdriverjs'),
    helper = require('../helper.js');

// dummy function used when the result is an expected error
function _(){}

// start the test
describe('Silex file explorer dialog test', function(){
  var client = {};
  this.timeout(10000);

  before(function(){
    this.timeout(99999999);
    client = helper.createClient(webdriverjs);
    client.init().windowHandleSize({width: 1024, height: 768});
  });

  it('should open Silex file explorer dialog',function(done) {
    client
      // load silex
      .url('http://localhost:6805/silex/')
      // wait for silex to be loaded
      .waitFor('.menu-item-file', 5000)
      .waitFor('.not-exist', 200, _)
      // open the file menu and click open
      .click('.menu-item-file')
      .click('.menu-item-file-open')
      // check that the file explorer is opened
      .waitFor('.silex-fileexplorer', 200)
      .isVisible('.silex-fileexplorer')
      .call(done);
  });

  it('should open the login popup',function(done) {
    // Silex main window Id
    var mainWindowId = null;

    client
      // store reference to Silex main window
      .getCurrentTabId(function(err, windowId){
        mainWindowId = windowId;
      })
      // click the www image
      .click('.ce-left-pane ul li:nth-of-type(2) span')
      // click the "CLICK HERE" text to open the login popup
      .waitFor('.authPopup>div', 2000, _)
      .waitFor('.not-exist', 200, _)
      .click('.authPopup>div')
      .waitFor('.not-exist', 200, _)
      // switch to auth popup
      .switchTab('authPopup')
      // type login and password then validate
      .addValue('input', 'admin')
      .addValue('div:nth-of-type(2) input', 'admin')
      .submitForm('input')
      .waitFor('.not-exist', 2000, _)
      .call(function(){
        // switch back to main window
        // - keep this in the call function because mainWindowId is set in a callback
        // and is null in the main "flow"
        client.switchTab(mainWindowId);
      })
      .waitFor('.not-exist', 200, _)
      // close the file explorer
      .isVisible('.ce-browser .close-btn')
      .click('.ce-browser .close-btn')
      .waitFor('.not-exist', 200, _)
      .call(done);
  });

  after(function(done) {
      client.end(done);
  });
});
