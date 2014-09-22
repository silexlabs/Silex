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
 *     The Silex "tasks" are nodejs methods which Silex adds to the unifle API.
 *     This class is a singleton.
 *
 */


goog.provide('silex.service.SilexTasks');



/**
 * the Silex SilexTasks singleton
 * @constructor
 * based on http://www.inkfilepicker.com/
 * load and save data to and from the cloud storage services
 */
silex.service.SilexTasks = function() {

};
goog.addSingletonGetter(silex.service.SilexTasks);


/**
 * publish a website to a given folder
 * @param {string} path
 * @param {string} html
 * @param {string} css
 * @param {string} js
 * @param {Array.<{url: string, destPath: string, srcPath: string}>} files
 * @param {function(string)} cbk to receive the json response
 * @param {function(string)=} opt_errCbk to receive the json response
 */
silex.service.SilexTasks.prototype.publish = function(path, html, css, js, files, cbk, opt_errCbk) {
  // check inputs
  if (goog.isNull(path) || goog.isNull(html) || goog.isNull(css) || goog.isNull(js) || goog.isNull(files)) {
    console.error('Param path, html, css, js or files missing');
    if (opt_errCbk) opt_errCbk('Param path, html, css, js or files missing');
    return;
  }
  var url = '/tasks/publish';
  var qd = new goog.Uri.QueryData();
  qd.add('path', path);
  qd.add('html', html);
  qd.add('css', css);
  qd.add('js', js);
  qd.add('files', JSON.stringify(files));
  goog.net.XhrIo.send(url, function(e) {
    // success of the request
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var json = xhr.getResponseJson();
      if (json.success) {
        if (cbk) cbk(json);
      }
      else {
        var message = json.code || json.message;
        console.error('Error in while trying to connect with back end', message, xhr, xhr.isSuccess(), xhr.getStatus(), xhr.headers.toString());
        if (opt_errCbk) {
          opt_errCbk(message);
        }
      }
    }
    else {
      var message = xhr.getLastError();
      console.error('Error in while trying to connect with back end', xhr.getLastError(), xhr.getLastErrorCode(), xhr.isSuccess(), xhr.getStatus(), xhr.headers);
      if (opt_errCbk) {
        opt_errCbk(message);
      }
    }
  }, 'POST', qd.toString());
};


/**
 * create a temp link on the server
 * @param path
 * @param {function(string)} cbk
 * @param {?function(string)=} opt_errCbk
 */
silex.service.SilexTasks.prototype.getTempLink = function(path, cbk, opt_errCbk) {
  var url = '/tasks/getTempLink?path=' + path;
  goog.net.XhrIo.send(url, function(e) {
    // success of the request
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var jsonString = xhr.getResponse();
      /** @type {?UnifileResponse} */
      var json = null;
      if (jsonString) {
        json = /** @type {UnifileResponse} */ (JSON.parse(jsonString));
      }
      if (jsonString && json && json.success === true && json.tempLink) {
        if (cbk) cbk(json.tempLink);
      }
      else {
        console.error('could not get temp link for resource', xhr, xhr.isSuccess(), xhr.getStatus(), xhr.headers.toString());
        if (opt_errCbk) {
          opt_errCbk('could not get temp link for resource');
        }
      }
    }
    else {
      var message = xhr.getLastError();
      console.error(xhr.getLastError(), xhr.getLastErrorCode(), xhr.isSuccess(), xhr.getStatus(), xhr.headers);
      if (opt_errCbk) {
        opt_errCbk(message);
      }
    }
  }, 'GET');
};


/**
 * remove the temp link on the server
 * @param name
 * @param {?function(UnifileResponse)=} opt_cbk
 * @param {?function(string)=} opt_errCbk
 */
silex.service.SilexTasks.prototype.disposeTempLink = function(name, opt_cbk, opt_errCbk) {
  var url = '/tasks/disposeTempLink?name=' + name;
  goog.net.XhrIo.send(url, function(e) {
    // success of the request
    var xhr = e.target;
    if (xhr.isSuccess()) {
      var json = /** @type {UnifileResponse} */ (xhr.getResponseJson());
      if (json.success === true) {
        if (opt_cbk) opt_cbk(json);
      }
      else {
        var message = /** @type {string} */ (json.code || json.message);
        console.error(message, xhr, xhr.isSuccess(), xhr.getStatus(), xhr.headers.toString());
        if (opt_errCbk) {
          opt_errCbk(message);
        }
      }
    }
    else {
      var message = xhr.getLastError();
      console.error('Error in while trying to connect with back end', xhr.getLastError(), xhr.getLastErrorCode(), xhr.isSuccess(), xhr.getStatus(), xhr.headers);
      if (opt_errCbk) {
        opt_errCbk(message);
      }
    }
  }, 'GET');
};
