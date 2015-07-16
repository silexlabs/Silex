// automate tasks in Silex

var fs = require('fs');
var file_explorer = require('./model/file-explorer-model.js');
var logging = require('./logging');


// dummy function used when the result is an expected error
function _(){}

// store the original main window Id
var originalTabId = null;
// store the frame which has focus
var currentFrame = null;

/**
 * switch frame
 * @param opt_frameId   the frame id or null for main Silex UI frame
 */
exports.switchFrame = function(client, opt_frameId, cbk){
    console.log('switchFrame(' + logging.argsToString(arguments) + ' - ' + currentFrame + '===' + opt_frameId);
    if (currentFrame && opt_frameId && currentFrame === opt_frameId) {
      console.error('we are already in this frame', currentFrame);
      console.trace();
    }
    if (currentFrame){
       client.frame();
    }
    if (opt_frameId){
       client.frame(opt_frameId);
    }
    currentFrame = opt_frameId;
    client
        .pause(200)
        .call(function(){console.log('-- switchFrame(', logging.argsToString(arguments));})
        .call(cbk);
}

/**
 * load Silex
 */
exports.loadSilex = function(client, cbk){
    console.log('loadSilex(' + logging.argsToString(arguments));
    // reset
    currentFrame = null;

    // start
    client
      // load silex
      .url('http://localhost:6805/')
      // wait for silex to be loaded
      .waitFor('.menu-item-file', 5000)
      // wait for the default website to load
      .pause(5000)
      .saveScreenshot ('after-loading.png')
      // store reference to Silex main window
      .getCurrentTabId(function(err, windowId){
        originalTabId = windowId;
      })
      .pause(200)
      .call(function(){console.log('-- loadSilex(', logging.argsToString(arguments));})
      .call(cbk);
}

/**
 * open Silex file explorer dialog
 */
exports.openFile = function(client){
    console.log('openFile(' + logging.argsToString(arguments))
    exports.switchFrame(client, null, function () {
          // open the file menu and click open
        file_explorer.openFile(client)

          client.pause(200)
        console.log('-- openFile(', logging.argsToString(arguments))
    });
}

/**
 * open Silex file explorer dialog
 */
exports.openInsertImage = function(client, cbk){
    console.log('openInsertImage(' + logging.argsToString(arguments));
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-insert')
          .click('.menu-item-insert-image')
          // check that the file explorer is opened
          .waitFor('#silex-file-explorer', 200)
          .isVisible('#silex-file-explorer')
          .pause(200)
          .call(function(){console.log('-- openInsertImage(', logging.argsToString(arguments));})
          .call(cbk);
    });
}

/**
 * open Silex file explorer dialog
 */
exports.openSelectBackgroundImage = function(client, cbk){
    console.log('openSelectBackgroundImage(' + logging.argsToString(arguments));
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.bg-image-button')
          // check that the file explorer is opened
          .waitFor('#silex-file-explorer', 200)
          .isVisible('#silex-file-explorer')
          .pause(200)
          .call(function(){console.log('-- openSelectBackgroundImage(', logging.argsToString(arguments));})
          .call(cbk);
    });
}

exports.checkForFile = function (path, cbk) {
    fs.exists(path, function (exists) {
        if(exists){
            cbk();
        }
        else{
            console.error('Error: ' + path + ' do not exist');
            cbk(path + ' do not exist');
        }
    });
};

exports.waitForFile = function (path, cbk) {
    console.log('waitForFile waiting for', path);
    var count = 0;
    var doWaitForFile = function () {
        fs.exists(path, function (exists) {
            if(exists){
                console.log('-- waitForFile returns', exists);
                cbk();
            }
            else if (count++ > 30){
                console.error('-- waitForFile Error: ' + path + ' do not exist');
                cbk(path + ' do not exist');
            }
            else{
                setTimeout(doWaitForFile, 1000);
            }
        });
    };
    doWaitForFile();
};
/**
 * open ce and save the website in the current directory with the given file name
 * @param   name    the name of the file to save, without extension
 */
exports.saveAs = function(client, name, cbk){
    var continueSaveAs = function() {
        exports.switchFrame(client, null, function () {
            client
                .pause(2000)
                .call(function(){console.log('-- saveAs(', logging.argsToString(arguments));})
                .call(cbk);
        });
    }
    console.log('saveAs(' + logging.argsToString(arguments));
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-file')
          .click('.menu-item-file-saveas')
          // check that the file explorer is opened
          .waitFor('#silex-file-explorer', 200)
          .pause(200)
          .call(function () {
              exports.switchFrame(client, 'silex-file-explorer', function () {
                client
                    .isVisible('//span[text()="' + name + '.html"]', function (err, isVisible) {
                        if(!err && isVisible){
                            exports.selectFile(client, name + '.html', function () {
                                client
                                    .call(continueSaveAs);
                            });
                        }
                        else{
                            client
                                .addValue('.footer input', name)
                                .click('.saveBtn')
                                .call(continueSaveAs);
                        }
                    })
              });
          })
    });
}

/**
 * open Silex file explorer dialog
 */
exports.setPublicationPath = function(client, path, cbk){
    console.log('setPublicationPath(' + logging.argsToString(arguments));
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-file')
          .click('.menu-item-file-publish-settings')
          // check that the file explorer is opened
          .waitFor('.silex-settings-dialog', 200)
          .isVisible('.dialogs-background')
          .addValue('input.input-publication-path', path)
          .click('.close-btn')
          .pause(200)
          .call(function(){console.log('-- setPublicationPath(', logging.argsToString(arguments));})
          .call(cbk);
    });
}

/**
 * publish website
 */
exports.publish = function(client, cbk){
    console.log('publish');
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-file')
          .click('.menu-item-file-publish')
          .saveScreenshot ('auto-test-tmp.png')
          .pause(2000)
          .call(function(){console.log('-- publish(');})
          .call(cbk);
    });
}

/**
 * in the file explorer: login to the "www" service and display files
 */
exports.enterWwwService = function(client, cbk){
    console.log('enterWwwService(' + logging.argsToString(arguments));
    // enter the cloud explorer frame
    exports.switchFrame(client, 'silex-file-explorer', function () {
        client
          // click the www image
          .click('.home ul .www')
          // click the "CLICK HERE" text to open the login popup
          .waitFor('.authPopup>div', 2000, _)
          .pause(200)
          .click('.authPopup a')
          .pause(200)
          .getTabIds (function(err, ids) {
            client.switchTab(ids[1])
          })
          // type login and password then validate
          .addValue('input', 'admin\tadmin\n')
          .pause(200)
          // switch back to current tab
          .call(function(){
            exports.switchToMainTab(client, function(){});
          })
          .pause(200)
          .call(function () {
                // enter the cloud explorer frame
                exports.switchFrame(client, 'silex-file-explorer', function () {
                    client
                        .pause(200)
                        // close the file explorer
                        .isVisible('.closeBtn')
                        .call(function(){console.log('-- enterWwwService(', logging.argsToString(arguments));})
                        .call(cbk);
                });
          });

    });
}

/**
 * enter a folder while the file explorer is opened
 */
exports.selectFile = function(client, folderName, cbk) {
    console.log('selectFile(' + logging.argsToString(arguments));
    exports.switchFrame(client, 'silex-file-explorer', function () {
        client
            .waitFor('//span[text()="'+folderName+'"]', 1000)
            .click('//span[text()="'+folderName+'"]')
            .pause(200)
            .call(function(){console.log('-- selectFile(', logging.argsToString(arguments));})
            .call(cbk);
    });
}

/**
 * click close button of CE
 */
exports.closeFileExplorer = function(client, cbk) {
    console.log('closeFileExplorer(' + logging.argsToString(arguments));
    exports.switchFrame(client, 'silex-file-explorer', function () {
        client
          .click('.closeBtn')
          .pause(200)
          .call(function(){console.log('-- closeFileExplorer(', logging.argsToString(arguments));})
          .call(cbk);
    });
}

/**
 * insert container
 */
exports.insertContainer = function(client, cbk) {
    console.log('insertContainer(' + logging.argsToString(arguments));
    exports.switchFrame(client, null, function () {
        client
          .click('.menu-item-insert')
          .click('.menu-item-insert-container')
          .pause(200)
          .call(function(){console.log('-- insertContainer(', logging.argsToString(arguments));})
          .call(cbk);
    });
}

/**
 * enter website iframe
 */
exports.switchToMainTab = function(client, cbk) {
    console.log('switchToMainTab(' + logging.argsToString(arguments));
    currentFrame = null;
    client
      .switchTab(originalTabId)
      .pause(200)
      .call(function(){console.log('-- switchToMainTab(', logging.argsToString(arguments));})
      .call(cbk);
}
