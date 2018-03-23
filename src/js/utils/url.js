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


goog.provide('silex.utils.Url');


goog.require('goog.Uri');
goog.require('goog.net.XhrIo');


/**
 * set a field in a FileInfo object, and update the `url` attribute accordingly
 * @param {?FileInfo} fileInfo
 * @param {Object} attributes a partial FileInfo object
 * @return {?FileInfo}
 */
silex.utils.Url.updateFileInfo = function(fileInfo, attributes) {
  if(!fileInfo) return null;
  const fileInfoNew = Object.assign({}, fileInfo, attributes);
  return /** @type {FileInfo} */ (Object.assign({}, fileInfoNew, {
    'url': silex.utils.Url.getBaseUrl() + fileInfoNew.service + '/get/' + fileInfoNew.path,
  }));
}


/**
 * Get base URL of Silex server
 */
silex.utils.Url.getBaseUrl = function() {
  return window.location.href;
};


/**
 * Get root of a URL or Silex app
 * @param  {?string=} opt_url URL or null
 * @return  {string} the base url
 * example: "" returns https://editor.silex.me
 * example: https://duckduckgo.com returns https://duckduckgo.com
 * example: https://duckduckgo.com/ returns https://duckduckgo.com
 * example: https://duckduckgo.com/?q=javascript returns https://duckduckgo.com
 * example: https://duckduckgo.com/abc/ returns https://duckduckgo.com
 */
silex.utils.Url.getRootUrl = function(opt_url) {
  const url = opt_url || window.location.href;
  // const rootUrl = /http.?:\/\/(.*)\//.match()[0];
  const start = url.indexOf('//');
  const end = url.indexOf('/', start + 2);
  return url.substr(0, end);
};


/**
 * Get host of Silex app
 * @param  {?string=} opt_url URL or null
 * @return  {string} the base url
 * example: https://duckduckgo.com returns duckduckgo.com
 * example: https://duckduckgo.com/ returns duckduckgo.com
 * example: https://duckduckgo.com/?q=javascript returns duckduckgo.com
 * example: https://duckduckgo.com/abc/ returns duckduckgo.com
 */
silex.utils.Url.getHost = function(opt_url) {
  var root = silex.utils.Url.getRootUrl(opt_url);
  var host = root.substr(root.indexOf('//') + 2);
  return host;
};


/**
 * Check if an URL is relative or absolute
 * @param {string} url
 * @return {boolean} true if the url is absolute
 */
silex.utils.Url.isAbsoluteUrl = function(url) {
  return url.indexOf('http') === 0 || url.indexOf('//') === 0;
};


/**
 * remove the url() css keyword
 * also remove the '' or "" if any
 * example: url(http://silex.me) would return http://silex.me
 * @param {string} url + keyword as for background-image
 * @return {string} URL without keyword
 */
silex.utils.Url.removeUrlKeyword = function(url) {
  // removes the url() keyword
  if (goog.string.startsWith(url, 'url(')) {
    url = url.substr(4);
  }
  if (goog.string.endsWith(url, ')')) {
    url = url.substr(0, url.length - 1);
  }
  // remove the ''
  if (goog.string.startsWith(url, '\'') || goog.string.startsWith(url, '"')) {
    url = url.substr(1);
  }
  if (goog.string.endsWith(url, '\'') || goog.string.endsWith(url, '"')) {
    url = url.substr(0, url.length - 1);
  }
  // workaround firefox going crazy
  if (goog.string.startsWith(url, '&quot;')) {
    url = url.substr(6);
  }
  if (goog.string.endsWith(url, '&quot;')) {
    url = url.substr(0, url.length - 6);
  }
  if (goog.string.startsWith(url, '%5C')) {
    url = url.substr(3);
  }
  if (goog.string.startsWith(url, '%22')) {
    url = url.substr(3);
  }
  if (goog.string.endsWith(url, '%22')) {
    url = url.substr(0, url.length - 3);
  }
  if (goog.string.endsWith(url, '%5C')) {
    url = url.substr(0, url.length - 3);
  }
  return url;
};


/**
 * add the url() css keyword
 * simple quotes are added so that the URL may contain parenthesis
 * and it does not disturb the inline style double quotes
 * example: http://silex.me returns url("http://silex.me")
 * @param {string} url
 * @return {string} url + keyword as for background-image
 */
silex.utils.Url.addUrlKeyword = function(url) {
  return `url('${url}')`;
};

