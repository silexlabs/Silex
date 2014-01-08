//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

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
 */
silex.service.SilexTasks.prototype.publish = function(path, html, css, js, files, cbk, opt_errCbk) {
  // check inputs
  if (goog.isNull(path) || goog.isNull(html) || goog.isNull(css) || goog.isNull(js) || goog.isNull(files)) {
    console.error('Param path, html, css, js or files missing');
    if (opt_errCbk) opt_errCbk('Param path, html, css, js or files missing');
    return;
  }
  var url = '/silex/tasks/publish';
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
        console.error(message, xhr, xhr.isSuccess(), xhr.getStatus(), xhr.headers.toString());
        if (opt_errCbk) {
          opt_errCbk(message);
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
  }, 'POST', qd.toString());
};
