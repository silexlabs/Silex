// automate tasks in Silex

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
    console.log('enter switchFrame(' + arguments);
    if (currentFrame){
       client.frame();
    }
    if (opt_frameId){
       client.frame(opt_frameId);
    }
    currentFrame = opt_frameId;
    client
        .pause(200)
        .call(function(){console.log('-- switchFrame(', arguments);})
        .call(cbk);
}

/**
 * load Silex
 */
exports.loadSilex = function(client, cbk){
    console.log('enter loadSilex(' + arguments);
    client
      // load silex
      .url('http://localhost:6805/silex/')
      // wait for silex to be loaded
      .waitFor('.menu-item-file', 5000)
      // store reference to Silex main window
      .getCurrentTabId(function(err, windowId){
        originalTabId = windowId;
      })
      .pause(200)
      .pause(200)
      .call(function(){console.log('-- loadSilex(', arguments);})
      .call(cbk);
}

/**
 * open Silex file explorer dialog
 */
exports.openFile = function(client, cbk){
    console.log('enter openFile(' + arguments);
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-file')
          .click('.menu-item-file-open')
          // check that the file explorer is opened
          .waitFor('#silex-file-explorer', 200)
          .isVisible('#silex-file-explorer')
          .pause(200)
          .call(function(){console.log('-- openFile(', arguments);})
          .call(cbk);
    });
}

/**
 * open Silex file explorer dialog
 */
exports.openInsertImage = function(client, cbk){
    console.log('enter openInsertImage(' + arguments);
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-insert')
          .click('.menu-item-insert-image')
          // check that the file explorer is opened
          .waitFor('#silex-file-explorer', 200)
          .isVisible('#silex-file-explorer')
          .pause(200)
          .call(function(){console.log('-- openInsertImage(', arguments);})
          .call(cbk);
    });
}

/**
 * open Silex file explorer dialog
 */
exports.openSelectBackgroundImage = function(client, cbk){
    console.log('enter openSelectBackgroundImage(' + arguments);
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.bg-image-button')
          // check that the file explorer is opened
          .waitFor('#silex-file-explorer', 200)
          .isVisible('#silex-file-explorer')
          .pause(200)
          .call(function(){console.log('-- openSelectBackgroundImage(', arguments);})
          .call(cbk);
    });
}

/**
 * open ce and save the website in the current directory with the given file name
 * @param   name    the name of the file to save, without extension
 */
exports.saveAs = function(client, name, cbk){
    var continueSaveAs = function() {
        exports.switchFrame(client, null, function () {
            client
                .pause(200)
                .waitFor('.alertify-log-success', 2000)
                .isVisible('.alertify-log-success')
                .call(function(){console.log('-- saveAs(', arguments);})
                .call(cbk);
        });
    }
    console.log('enter saveAs(' + arguments);
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-file')
          .click('.menu-item-file-saveas')
          // check that the file explorer is opened
          .waitFor('#silex-file-explorer', 200)
          .isVisible('#silex-file-explorer')
          .pause(200)
          .call(function () {
              exports.switchFrame(client, 'silex-file-explorer', function () {
                client
                    .isVisible('//span[text()="'+name+'.html"]', function (err, isVisible) {
                        console.log('isVisible', arguments);
                        if(isVisible){
                            exports.selectFile(client, name + '.html', function () {
                                client
                                    .call(continueSaveAs);
                            });
                        }
                        else{
                            client
                                .addValue('.footer input', name)
                                .click('.saveBtn')
                                .pause(200)
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
    console.log('enter setPublicationPath(' + arguments);
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-file')
          .click('.menu-item-file-publish-settings')
          // check that the file explorer is opened
          .waitFor('.silex-settings-dialog', 200)
          .isVisible('.settings-background')
          .addValue('input.input-publication-path', path)
          .click('.close-btn')
          .pause(200)
          .call(function(){console.log('-- setPublicationPath(', arguments);})
          .call(cbk);
    });
}

/**
 * publish website
 */
exports.publish = function(client, cbk){
    console.log('enter publish(' + arguments);
    exports.switchFrame(client, null, function () {
        client
          // open the file menu and click open
          .click('.menu-item-file')
          .click('.menu-item-file-publish')
          .waitFor('.alertify-log-success', 2000)
          .isVisible('.alertify-log-success')
          .pause(2000)
          .call(function(){console.log('-- publish(', arguments);})
          .call(cbk);
    });
}

/**
 * in the file explorer: login to the "www" service and display files
 */
exports.enterWwwService = function(client, cbk){
    console.log('enter enterWwwService(' + arguments);
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
          .waitFor('.not-exist', 2000, _)
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
                        .call(function(){console.log('-- enterWwwService(', arguments);})
                        .call(cbk);
                });
          });

    });
}

/**
 * enter a folder while the file explorer is opened
 */
exports.selectFile = function(client, folderName, cbk) {
    console.log('enter selectFile(' + arguments);
    exports.switchFrame(client, 'silex-file-explorer', function () {
        client
            .waitFor('//span[text()="'+folderName+'"]', 1000)
            .click('//span[text()="'+folderName+'"]')
            .pause(200)
            .call(function(){console.log('-- selectFile(', arguments);})
            .call(cbk);
    });
}

/**
 *
 */
exports.closeFileExplorer = function(client, cbk) {
    console.log('enter closeFileExplorer(' + arguments);
    exports.switchFrame(client, 'silex-file-explorer', function () {
        client
          .click('.closeBtn')
          .pause(200)
          .call(function(){console.log('-- closeFileExplorer(', arguments);})
          .call(cbk);
    });
}

/**
 * insert container
 */
exports.insertContainer = function(client, cbk) {
    console.log('enter insertContainer(' + arguments);
    exports.switchFrame(client, null, function () {
        client
          .click('.menu-item-insert')
          .click('.menu-item-insert-container')
          .pause(200)
          .call(function(){console.log('-- insertContainer(', arguments);})
          .call(cbk);
    });
}

/**
 * enter website iframe
 */
exports.switchToMainTab = function(client, cbk) {
    console.log('enter switchToMainTab(' + arguments);
    currentFrame = null;
    client
      .switchTab(originalTabId)
      .pause(200)
      .call(function(){console.log('-- switchToMainTab(', arguments);})
      .call(cbk);
}
