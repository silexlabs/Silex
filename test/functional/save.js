/*
  for webdriver.io documentation
  http://webdriver.io/api.html
*/


var helper = require('../helper.js'),
    actions = require('../actions.js');

// dummy function used when the result is an expected error
function _(){}

if (!helper.getDriverName()){
  console.error('You are supposed to call mocha with param \'--firefox\', \'--chrome\' or \'--phantomjs\'. Canceling tests.');
  return;
}

// start the test
describe('Silex insert and publish test', function(){
  var publishFolder = __dirname + '/../../dist/client/functional-tests';
  var client = {};
  this.timeout(100000);

  // before tests, setup
  before(function(){
    this.timeout(99999999);
    client = helper.createClient();
  });

  // insert an image
  it('should insert an image',function(done) {
    actions.loadSilex(client, function () {
        // open Silex file explorer dialog
        actions.openInsertImage(client, function () {
            // login to the "www" service and display files
            actions.enterWwwService(client, function () {
                // enter functional-tests folder
                actions.selectFile(client, 'functional-tests', function () {
                    actions.selectFile(client, 'image1.png', function () {
                        done();
                    });
                });
            });
        });
    })
  });

  // set a backgound image on the main container
  it('should set a backgound image on the main container',function(done) {
    actions.switchFrame(client, 'silex-stage-iframe', function () {
        // click background
        client
            .click('.background', function (err, res) {
                actions.openSelectBackgroundImage(client, function () {
                    actions.selectFile(client, 'image2.png', function () {
                        done();
                    });
                });
            });
    })
  });

  // set a backgound image on the body
  it('should set a backgound image on the body',function(done) {
    actions.insertContainer(client, function (err, res) {
        actions.openSelectBackgroundImage(client, function () {
            actions.selectFile(client, 'image3.png', function () {
                done();
            });
        });
    });
  });

  // save the website
  it('should save the website',function(done) {
    // FIXME: check if exist and remove editable.html
    actions.saveAs(client, 'editable', function () {
        actions.checkForFile(publishFolder + '/editable.html', done);
    });
    // FIXME: check if editable.html exists and contains the images urls
  });

  // overrite an existing file
  it('should save the website',function(done) {
    actions.saveAs(client, 'editable', function () {
        actions.checkForFile(publishFolder + '/editable.html', done);
    });

    // FIXME: check if editable.html exists and contains the images urls
  });

  // After tests, cleanup
  after(function(done) {
      client.end(done);
  });
});
