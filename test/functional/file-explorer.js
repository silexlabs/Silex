/*
  for webdriver.io documentation
  https://github.com/camme/webdriverjs
*/


var webdriverjs = require('webdriverjs'),
    helper = require('../helper.js');

// dummy function used when the result is an expected error
function _(){}

if (!helper.getDriverName()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

// start the test
describe('Silex file explorer dialog test', function(){
  var client = {};
  this.timeout(10000);

  // before tests, setup
  before(function(){
    this.timeout(99999999);
    client = helper.createClient(webdriverjs);
    client.init().windowHandleSize({width: 1024, height: 768});
  });

  // open Silex file explorer dialog
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
      .waitFor('#silex-file-explorer', 200)
      .isVisible('#silex-file-explorer')
      .call(done);
  });

  // in the file explorer: login to the "www" service and display files
  it('login to the "www" service and display files',function(done) {
    // store the original main window Id
    var originalTabId = null;
    // start the test
    client
      // store reference to Silex main window
      .getCurrentTabId(function(err, windowId){
        originalTabId = windowId;
      })
      // enter the cloud explorer frame
      .frame('silex-file-explorer')
      // click the www image
      .click('.home ul .www')
      // click the "CLICK HERE" text to open the login popup
      .waitFor('.authPopup>div', 2000, _)
      .waitFor('.not-exist', 200, _)
      .click('.authPopup a')
      .waitFor('.not-exist', 200, _)
      // switch to new winfow
      .getCurrentTabId (function(err, id){
        originalTabId = id
      })
      .getTabIds (function(err, ids) {
        client.switchTab(ids[1])
      })
      // type login and password then validate
      .addValue('input', 'admin\tadmin\n')
      .waitFor('.not-exist', 2000, _)
      // switch back to current tab
      //    keep the call to switchTab in a function because originalTabId is set in a callback
      //    and is null in the main "flow"
      .call(function(){
        client.switchTab(originalTabId);
      })
      .waitFor('.not-exist', 200, _)
      // enter the cloud explorer frame
      .frame('silex-file-explorer')
      // close the file explorer
      .isVisible('.closeBtn')
      .click('.closeBtn')
      .waitFor('.not-exist', 200, _)
      .call(done);
  });
  // After tests, cleanup
  after(function(done) {
      client.end(done);
  });
});
