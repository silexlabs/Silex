/*
  for webdriver.io documentation
  https://github.com/camme/webdriverjs
*/


var webdriverjs = require('webdriverjs'),
    helper = require('../helper.js'),
    actions = require('../actions.js');

// dummy function used when the result is an expected error
function _(){}

if (!helper.getDriverName()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

// start the test
describe('Silex insert and publish test', function(){
  var client = {};
  this.timeout(100000);

  // before tests, setup
  before(function(){
    this.timeout(99999999);
    client = helper.createClient(webdriverjs);
    client.init().windowHandleSize({width: 1024, height: 768});
  });
  // publish the website
  it('should publish the website',function(done) {
    // FIXME: check that editable.html exists
    actions.loadSilex(client, function () {
        actions.openFile(client, function () {
            actions.enterWwwService(client, function () {
                actions.selectFile(client, 'functional-tests', function () {
                    actions.selectFile(client, 'editable.html', function () {
                        // set the publication path
                        actions.setPublicationPath(client, '../api/1.0/www/exec/put/functional-tests/publish', function () {
                            actions.publish(client, function () {
                                done();
                                // wait
                                // check images are in test/functional-tests
                                // check index.html contains no images
                                // check style.css contains the images
                            });
                        });
                    });
                });
            });
        });
    });
  });
  // After tests, cleanup
  after(function(done) {
      client.end(done);
  });
});
