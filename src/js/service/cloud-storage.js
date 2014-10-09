/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview Service used to interact with the unifile server.
 *     This class is a singleton.
 *
 */


goog.provide('silex.service.CloudStorage');

goog.require('goog.net.XhrIo');



/**
 * the Silex CloudStorage singleton
 * @constructor
 * based on http://www.inkfilepicker.com/
 * load and save data to and from the cloud storage services
 */
silex.service.CloudStorage = function() {
  this.filePicker = ce.api.CloudExplorer.get('silex-file-explorer');
};
goog.addSingletonGetter(silex.service.CloudStorage);


/**
 * reference to the filepicker instance
 * @type {Object}
 */
silex.service.CloudStorage.prototype.filePicker;


/**
 * create a blob out of an url
 */
silex.service.CloudStorage.prototype.createBlob = function(url) {
  // cloud explorer expects relative path
  if (silex.utils.Url.isAbsoluteUrl(url)) {
    console.error('cloud explorer expects relative path');
    throw new Error('cloud explorer expects relative path');
  }
  // create the blob
  var relBlob = {
    'url': url
  };
  return relBlob;
};


/**
 * save a file
 */
silex.service.CloudStorage.prototype.save = function(url, rawData, cbk, opt_errCbk) {
  // get teh blob corresponding to the url
  var relBlob = this.createBlob(url);
  // save the data
  this.filePicker.write(
      relBlob,
      rawData,
      function(blob) {
        if (cbk) cbk();
      },
      function(FPError) {
        console.error(FPError);
        if (opt_errCbk) {
          console.error(FPError);
          opt_errCbk(FPError);
        }
      });
};


/**
 * load data
 */
silex.service.CloudStorage.prototype.load = function(url, cbk, opt_errCbk) {
  // get teh blob corresponding to the url
  var relBlob = this.createBlob(url);

  // load the data
  this.filePicker.read(
      relBlob,
      function(data) {
        if (cbk) cbk(data);
      },
      function(FPError) {
        console.error(FPError);
        if (opt_errCbk) {
          console.error(FPError);
          opt_errCbk(FPError);
        }
      });
};


/**
 * load data
 */
silex.service.CloudStorage.prototype.loadLocal = function(url, cbk, opt_errCbk) {
  goog.net.XhrIo.send(url, function(e) {
    // success of the request
    var xhr = e.target;
    var rawHtml = xhr.getResponse();
    if (xhr.isSuccess()) {
      if (cbk) cbk(rawHtml);
    }
    else {
      var message = xhr.getLastError();
      console.error(message, xhr, xhr.isSuccess(), xhr.getStatus(), xhr.headers.toString());
      if (opt_errCbk) {
        opt_errCbk(message);
      }
    }
  });
};
