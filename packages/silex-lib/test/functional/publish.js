/*
  for webdriver.io documentation
  https://github.com/camme/webdriverjs
*/


var webdriverjs = require('webdriverjs'),
    helper = require('../helper.js'),
    actions = require('../actions.js'),
    fs = require('fs');

// dummy function used when the result is an expected error
function _(){}

if (!helper.getDriverName()){
  console.error('You are supposed to call grunt with param \'-firefox\', \'-chrome\' or \'-phantomjs\'. Canceling tests.');
  return;
}

// start the test
describe('Silex insert and publish test', function(){
  var publishFolder = __dirname + '/../../www/functional-tests/publish';

  var client = {};
  this.timeout(100000);

  // before tests, setup
  before(function(done){
    this.timeout(99999999);
    console.log('publishFolder', publishFolder);
    var next = function () {
//return;
        console.log('next');
        // create the client
        client = helper.createClient(webdriverjs);
        done();
    }
    // cleanup the content of the publish folder
    fs.exists(publishFolder, function (exists) {
        if (exists){
            // delete the files in the folder
            fs.exists(publishFolder + '/index.html', function (exists) {
                console.log('exists '+ publishFolder + '/index.html', arguments);
                if(exists){
                    fs.chmod(publishFolder, 777, function () {
                        console.log('chmod done', arguments);
                        fs.unlink(publishFolder, function () {
                            console.log('unlink done', arguments);
                            // recreate the publish folder
                            fs.mkdir(publishFolder, function () {
                                console.log('cleanup done', arguments);
                                next();
                            });
                        });
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
        actions.openFile(client, function () {
            actions.enterWwwService(client, function () {
                actions.selectFile(client, 'functional-tests', function () {
                    actions.selectFile(client, 'editable-publish.html', function () {
                        actions.switchFrame(client, null, function () {
                            // ici bug dans phantomjs
                            client
                                .waitFor('.alertify-log-success', 4000)
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
      var waitForFile = function (path) {
          fs.exists(path, function (exists) {
              if(exists){
                  done();
              }
              else{
                  setTimeout(waitForFile, 200);
              }
          });
      };
      waitForFile(publishFolder + '/index.html');
  });
  // check images are in test/functional-tests
  it('should create index.html',function(done) {
      var checkForFile = function (path, next) {
          fs.exists(path, function (exists) {
              if(exists){
                  next();
              }
              else{
                  console.error('Error: ' + path + ' do not exist');
                  done(path + ' do not exist');
              }
          });
      };
      checkForFile(publishFolder + '/assets/image1.png', function () {
          checkForFile(publishFolder + '/assets/image2.png', function () {
            checkForFile(publishFolder + '/assets/image3.png', function () {
                done();
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
          console.log(data);
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
