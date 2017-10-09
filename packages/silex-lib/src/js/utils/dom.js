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
 * @fileoverview Helper class for common tasks
 *
 */


goog.provide('silex.utils.Dom');



/**
 * @constructor
 * @struct
 */
silex.utils.Dom = function() {
  throw ('this is a static class and it canot be instanciated');
};


/**
 * name of the get param used to store the timestamp (cache control)
 * @constant
 */
silex.utils.Dom.CACHE_CONTROL_PARAM_NAME = 'silex-cache-control';


/**
 * refresh an image with its latest version on the server
 * @param  {Element} img
 * @param  {function()} cbk
 */
silex.utils.Dom.refreshImage = function(img, cbk) {
  var initialUrl = img.src;
  img.onload = function(e) {
    // stop the process
    img.onload = null;
    cbk();
  };
  img.src = silex.utils.Dom.addCacheControl(initialUrl);
};


/**
 * add cache control to an URL
 * handle the cases where there is a ? or & or an existing cache control
 * example: silex.utils.Dom.addCacheControl('aaaaaaaa.com') returns 'aaaaaaaa.com?silex-cache-control=09238734099890'
 * @param {string} url
 * @return {string}
 */
silex.utils.Dom.addCacheControl = function(url) {
  // remove existing cache control if any
  url = silex.utils.Dom.removeCacheControl(url);
  // add an url separator
  if (url.indexOf('?') > 0) {
    url += '&';
  }
  else {
    url += '?';
  }
  // add the timestamp
  url += silex.utils.Dom.CACHE_CONTROL_PARAM_NAME + '=' + Date.now();
  // return the new url
  return url;
};


/**
 * remove cache control from an URL
 * handle the cases where there are other params in get
 * works fine when url contains several URLs with cache control or other text (like a full image tag with src='')
 * example: silex.utils.Dom.addCacheControl('aaaaaaaa.com?silex-cache-control=09238734099890') returns 'aaaaaaaa.com'
 * @param {string} url
 * @return {string}
 */
silex.utils.Dom.removeCacheControl = function(url) {
  // only when there is an existing cache control
  if (url.indexOf(silex.utils.Dom.CACHE_CONTROL_PARAM_NAME) > 0) {
    var re = new RegExp('([\?|&|&amp;]' + silex.utils.Dom.CACHE_CONTROL_PARAM_NAME + '=[0-9]*[&*]?)', 'gi');
    url = url.replace(re, function(match, group1, group2) {
      // if there is a ? or & then return ?
      // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
      // aaaaaaaa.com?silex-cache-control=09238734099890
      // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
      // aaaaaaaa.com?xxx&silex-cache-control=09238734&ccsqcqsc&
      if (group1.charAt(0) === '?' && group1.charAt(group1.length - 1) === '&') {
        return '?';
      }
      else if (group1.charAt(group1.length - 1) === '&' || group1.charAt(0) === '&') {
        return '&';
      }
      else {
        return '';
      }
    });
  }
  // return the new url
  return url;
};



/**
 * prevent scripts from executing in components, html boxes...
 * @param {string} html
 * @return {string} a safe html string
 */
silex.utils.Dom.deactivateScripts = function(html) {
  return html.replace(/<script.*class=\"silex-script\".*?>/gi, '<script type="text/notjavascript" class="silex-script">');

};



/**
 * undo the deactivateScript
 * @param {string} html
 * @return {string} the original html string
 */
silex.utils.Dom.reactivateScripts = function(html) {
  return html.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
};


/**
 * render a template by duplicating the itemTemplateString and inserting the data in it
 * @param {string} itemTemplateString   the template containing \{\{markers\}\}
 * @param {Array.<Object>}  data                 the array of strings conaining the data
 * @return {string} the template string with the data in it
 */
silex.utils.Dom.renderList = function(itemTemplateString, data) {
  var res = '';
  // for each item in data, e.g. each page in the list
  data.forEach(itemData => {
    // build an item
    var item = itemTemplateString;
    // replace each key by its value
    for (let key in itemData) {
      var value = itemData[key];
      item = item.replace(new RegExp('{{' + key + '}}', 'g'), value);
    }
    // add the item to the rendered template
    res += item;
  });
  return res;
};


/**
 * publish the file to a folder
 * get all the files included in the website, and put them into assets/ or js/ or css/
 * the HTML file must be saved somewhere because all URLs are made relative
 * This method uses a temporary iframe to manage the temporary dom
 * @param {FileInfo} publicationFolder    the folder where to publish to
 * @param {FileInfo} file    the file being published
 * @param {string} html    the html data of the website
 * @param {function()} statusCallback callback to be notified when operation is done
 * @param {function(string)=} opt_errCbk    callback to be notified of server side errors
 */
silex.utils.Dom.publish = function(publicationFolder, file, html, statusCallback, opt_errCbk) {
//  // get the base url for the provided file url
//  // @type {string}
//  var baseUrl = silex.utils.Url.getBaseUrl() + file.service + '/get/' + file.path.slice(0, -file.name.length);
//  console.log('publish', publicationFolder, file, baseUrl);
//  // create the iframe used to compute temporary dom
//  var iframe = document.createElement('iframe')
//  iframe.style.display = 'none';
//  document.body.appendChild(iframe);
//  // wait untill iframe is ready
//  goog.events.listenOnce(iframe, 'load', function(e) {
//    // clean up the DOM
//    var cleanedObj = silex.utils.DomCleaner.cleanup(iframe.contentDocument, baseUrl);
//    // store the files to download and copy to assets, scripts...
//    var htmlString = cleanedObj['htmlString'];
//    var cssString = cleanedObj['cssString'];
//    var jsString = cleanedObj['jsString'];
//    var files = cleanedObj['files'];
//    // get rid of the iframe
//    document.body.removeChild(iframe);
//    // call the publish service
//    silex.service.SilexTasks.getInstance().publish(publicationFolder, htmlString, cssString, jsString, files, statusCallback, opt_errCbk);
//  }, false);
//  // prevent scripts from executing
//  html = html.replace(/type=\"text\/javascript\"/gi, 'type="text/notjavascript"');
//  // write the content (leave this after "listen")
//  iframe.contentDocument.open();
//  iframe.contentDocument.write(html);
//  iframe.contentDocument.close();
};
