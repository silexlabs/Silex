/*
  for webdriver.io documentation
  https://github.com/camme/webdriverjs
*/


var webdriverjs = require('webdriverjs'),
    helper = require('../helper.js'),
    actions = require('../actions.js');


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
    actions.loadSilex(client, function () {
        actions.openFile(client, done);
    });
  });
  // in the file explorer: login to the "www" service and display files
  it('login to the "www" service and display files',function(done) {
    actions.enterWwwService(client, function () {
        actions.closeFileExplorer(client, done);
    })
  });
  // After tests, cleanup
  after(function(done) {
      client.end(done);
  });
});
