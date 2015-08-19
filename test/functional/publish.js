/*
  for webdriver.io documentation
  http://webdriver.io/api.html
*/

var helper = require('../helper.js'),
    actions = require('../actions.js'),
    fs = require('fs'),
    file_explorer = require('../model/file-explorer-model.js');

// dummy function used when the result is an expected error
function _(){}

if (!helper.getDriverName()){
  console.error('You are supposed to call mocha with param \'--firefox\', \'--chrome\' or \'--phantomjs\'. Canceling tests.');
  return;
}

// start the test
describe('Silex insert and publish test', function(){
  var publishFolder = __dirname + '/../../dist/client/functional-tests/publish';

  var client = {};
  this.timeout(100000);

  // before tests, setup
  before(function(done){
    this.timeout(99999999);
    var next = function () {
        // create the client
        client = helper.createClient();
        done();
    }
    // cleanup the content of the publish folder
    fs.exists(publishFolder, function (exists) {
        if (exists){
            // delete the files in the folder
            fs.exists(publishFolder + '/index.html', function (exists) {
                if(exists){
                    fs.unlink(publishFolder, function () {
                        console.log('unlink done', arguments);
                        setTimeout(function () {
                            // recreate the publish folder
                            fs.mkdir(publishFolder, 0777, function () {
                                console.log('cleanup done', arguments);
                                next();
                            });
                        }, 200);
                    });
                }
                else{
                    console.log('cleanup: not exists', publishFolder + '/index.html');
                    next();
                }
            });
        }
        else{
            console.log('cleanup: not exists', publishFolder);
            fs.mkdir(publishFolder, function () {
                console.log('cleanup done', arguments);
                next();
            });
        }
    });
  });

  // publish the website
  it('should publish the website',function(done) {
    // FIXME: check that editable.html exists
    actions.loadSilex(client, function () {
        file_explorer.openFile(client, function () {
            actions.enterWwwService(client, function () {
                actions.selectFile(client, 'functional-tests', function () {
                    actions.selectFile(client, 'editable-publish.html', function () {
                        actions.switchFrame(client, null, function () {
                            // ici bug dans phantomjs
                            client
                                .saveScreenshot ('auto-test-tmp.png')
                                .call(function () {
                                    // set the publication path
                                    actions.setPublicationPath(client, '../api/1.0/www/exec/put/functional-tests/publish', function () {
                                        actions.publish(client, function () {
                                            done();
                                        });
                                    });
                                })
                        });
                    });
                });
            });
        });
    });
  });
  // wait for index.html
  it('should create index.html',function(done) {
      actions.waitForFile(publishFolder + '/index.html', done);
  });
  // check images are in test/functional-tests
  it('should create assets folder with the images',function(done) {
      actions.checkForFile(publishFolder + '/assets/image1.png', function (err) {
          actions.checkForFile(publishFolder + '/assets/image2.png', function (err) {
            actions.checkForFile(publishFolder + '/assets/image3.png', function (err) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
        });
      });
  });
  // check index.html contains no images, no 'notjavascript'
  it('should generate a clean index.html file',function(done) {
    fs.readFile(publishFolder + '/index.html', function (err, data) {
      if (err) {
        console.error('Error: ', err);
        done(err);
      }
      else{
          if (data.toString().indexOf('notjavascript') >= 0){
            var msg = 'Error: notjavascript scripts remain in published html file';
            console.error(msg);
            done(msg);
          }
          else{
            done();
          }
      }
    });
  });


// TODO: check style.css contains the images

  // After tests, cleanup
  after(function(done) {
      client.end(done);
  });
});
