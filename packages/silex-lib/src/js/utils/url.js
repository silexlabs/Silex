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
 * cleanup URLs and remove double slashes which are sometimes added by cloud explorer / unifile
 * FIXME: fix the issue in cloud explorer/unifile
 */
silex.utils.Url.workaroundCE = function(url) {
  // cleanup: replace all groups of slashes by one slash, except when it has http(s):// or url(' in front of it
  // this is to handle the cases like ../../..//sites-silex/ or api/v1.0/dropbox/get//sites-silex/
  // this is a workaround for cloud explorer
  url = url.replace(/(.)(:|'|"|\(|)(\/\/+)/, (match, p1, p2, p3) => {
      // case where /(//...///) do not have : or ' or " or ... in just before it
      if (p2 === '') {
        return p1 + '/';
      }
      // this is not a bug, not like ../../..//sites-silex/
      return match;
  }, 'g');
  return url;
}


/**
 * Get base URL corresponding to a file URL
 * @param {string=} opt_url  the URL of the file, or null to get the base URL of silex editor e.g. http://www.silex.me/
 * @return  {string} the base url
 */
silex.utils.Url.getBaseUrl = function(opt_url) {
  // default value is silex editor URL
  if (!opt_url) {
    opt_url = window.location.href;
  }
  else {
    opt_url = silex.utils.Url.getAbsolutePath(opt_url, window.location.href);
  }
  // remove the hash
  if (opt_url.indexOf('#') > 0) {
    opt_url = opt_url.substr(0, opt_url.indexOf('#'));
  }
  // return the URL but the file name
  return opt_url.substr(0, opt_url.lastIndexOf('/') + 1);
};


/**
 * Get root URL of Silex app
 * @return  {string} the base url
 * example: https://duckduckgo.com returns https://duckduckgo.com
 * example: https://duckduckgo.com/ returns https://duckduckgo.com
 * example: https://duckduckgo.com/?q=javascript returns https://duckduckgo.com
 * example: https://duckduckgo.com/abc/ returns https://duckduckgo.com
 */
silex.utils.Url.getRootUrl = function() {
  return window.location.href.substr(0, window.location.href.lastIndexOf(window.location.pathname));
};


/**
 * Get host of Silex app
 * @return  {string} the base url
 * example: https://duckduckgo.com returns duckduckgo.com
 * example: https://duckduckgo.com/ returns duckduckgo.com
 * example: https://duckduckgo.com/?q=javascript returns duckduckgo.com
 * example: https://duckduckgo.com/abc/ returns duckduckgo.com
 */
silex.utils.Url.getHost = function() {
  var root = silex.utils.Url.getRootUrl();
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
 * Browse the children and convert all URLs to relative when possible
 * this will not work, because element.style.backgroundImage is reevaluated when set to a relative value
 * @param   {string} htmlString  the html content to set
 * @param   {string} baseUrl      the base URL for relative/absolute conversion
 * @return {string}
 */
silex.utils.Url.absolute2Relative = function(htmlString, baseUrl) {
  baseUrl = silex.utils.Url.getAbsolutePath(baseUrl, silex.utils.Url.getBaseUrl());
  // image source
  htmlString = htmlString.replace(/src="?([^" ]*)"/gi, function(match, group1) {
    var res = match.replace(group1, silex.utils.Url.getRelativePath(group1, baseUrl));
    return res;
  });
  // href (links and favicon)
  htmlString = htmlString.replace(/href="?([^" ]*)"/gi, function(match, group1, group2) {
    if (group1.indexOf('#') === 0) {
      // case of an anchor or page name
      return match;
    }
    else {
      var res = match.replace(group1, silex.utils.Url.getRelativePath(group1, baseUrl));
      return res;
    }
  });
  // css url()
  htmlString = htmlString.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
    // get the url
    var url = silex.utils.Url.removeUrlKeyword(group2);
    // convert to relative path
    url = silex.utils.Url.getRelativePath(url, baseUrl);
    // rebuild url('') with the relative path
    url = silex.utils.Url.addUrlKeyword(url);
    return url;
  });
  return htmlString;
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


/**
 * convert all URLs to absolute
 * @param   {string} htmlString  the html content to set
 * @param   {string} baseUrl      the base URL for relative/absolute conversion
 * @return {string}
 */
silex.utils.Url.relative2Absolute = function(htmlString, baseUrl) {
  // image source
  htmlString = htmlString.replace(/src="?([^" ]*)"/gi, function(match, group1, group2) {
    var res = match.replace(group1, silex.utils.Url.getAbsolutePath(group1, baseUrl));
    return res;
  });
  // href (links and favicon)
  htmlString = htmlString.replace(/href="?([^" ]*)"/gi, function(match, group1, group2) {
    var res = match.replace(group1, silex.utils.Url.getAbsolutePath(group1, baseUrl));
    return res;
  });
  // css url()
  htmlString = htmlString.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
    // get the url
    var url = silex.utils.Url.removeUrlKeyword(group2);
    // convert to relative path
    url = silex.utils.Url.getAbsolutePath(url, baseUrl);
    // rebuild url('') with the relative path
    url = silex.utils.Url.addUrlKeyword(url);
    return url;
  });
  return htmlString;
};


/**
 * Get a relative path from an absolute URL, given a base URL
 * @param  {string} url   a URL which has to end with a '/' or with a file name
 * @param  {string} base  a URL which has to end with a '/' or with a file name
 * @return {string}       a path from the base to the url
 * example:     silex.utils.Url.getRelativePath("http://abc.com/d/f/g/file.html","http://abc.com/d/e/");
 *              base    http://abc.com/d/e/
 *              url     http://abc.com/d/f/g/file.html
 *              result  ../f/g/file.html
 */
silex.utils.Url.getRelativePath = function(url, base) {
  // check if they are both absolute urls
  if (silex.utils.Url.isAbsoluteUrl(base) === false || silex.utils.Url.isAbsoluteUrl(url) === false ||
    url.indexOf('data:') === 0) {
    return url;
  }
  base = silex.utils.Url.workaroundCE(base);
  url = silex.utils.Url.workaroundCE(url);
  // get an array out of the URLs
  var urlArr = url.split('/');
  var baseArr = base.split('/');
  // keep track of the file name if any
  var fileName = urlArr[urlArr.length - 1];
  // remove the filename and the last '/'
  urlArr.pop();
  baseArr.pop();
  // remove the http[s]://
  urlArr.shift();
  urlArr.shift();
  baseArr.shift();
  baseArr.shift();
  // check if they are on the same domain
  if (baseArr[0] !== urlArr[0]) {
    return url;
  }
  // remove the common part
  while (baseArr.length > 0 && urlArr.length > 0 && baseArr[0] === urlArr[0]) {
    baseArr.shift();
    urlArr.shift();
  }

  // as many '../' as there are folders left in the base url
  var relativePath = '';
  for (let idx = 0; idx < baseArr.length; idx++) {
    relativePath += '../';
  }

  // now append the folders from url and the file name
  if (urlArr.length > 0) {
    relativePath += urlArr.join('/') + '/';
  }
  relativePath += fileName;

  return relativePath;
};


/**
 * convert relative to absolute url
 * use http://docs.closure-library.googlecode.com/git/class_goog_Uri.html
 * @param {string} rel    the path to be made absolute, e.g. /
 * @param {string} base    the base URL, which must end with either a '/' or a file name
 * @return {string} absolute url of the relative path
 */
silex.utils.Url.getAbsolutePath = function(rel, base) {
  if (rel.indexOf('#') === 0 || rel.indexOf('//') === 0 || rel.indexOf('data:') === 0) {
    // do not convert to absolute the anchors or protocol agnostic urls nor data: images
    return rel;
  }
  base = silex.utils.Url.workaroundCE(base);
  rel = silex.utils.Url.workaroundCE(rel);
  return goog.Uri.resolve(base, rel).toString();
};


/**
 * check if the file name has the desired extension
 * @param   {string} fileName  the file name to be checked
 * @param   {Array.<string>} extArray  the allowed extensions
 * @return  {boolean} true if the file has an extension which is in the array
 */
silex.utils.Url.checkFileExt = function(fileName, extArray) {
  var ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
  for (let idx in extArray) {
    if (extArray[idx] === ext) {
      return true;
    }
  }
  return false;
};
