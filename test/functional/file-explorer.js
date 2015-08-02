/*
  for webdriver.io documentation
  http://webdriver.io/api.html
*/

var helper = require('../helper.js'),
    actions = require('../actions.js'),
    file_explorer = require('../model/file-explorer-model.js'),
    assert = require ('assert');



if (!helper.getDriverName()){
  console.error('You are supposed to call mocha with param \'--firefox\', \'--chrome\' or \'--phantomjs\'. Canceling tests.');
  return;
}

// start the test
describe('Silex file explorer dialog test', function(){
  var client = {};
  this.timeout(10000);

  // before tests, setup
  before(function(){
    this.timeout(99999999);
    client = helper.createClient();
  });

  // open Silex file explorer dialog
  it('should open Silex file explorer dialog',function(done) {
    actions.loadSilex(client, function () {
        file_explorer.openFile(client, function (){
          file_explorer.isFileExplorerVisible(client, function(isVisible) {
            assert.equal(true,isVisible,"file explorer not visible");
            done();
          });
        });
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
