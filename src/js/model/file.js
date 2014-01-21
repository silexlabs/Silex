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
 * @fileoverview
 *   This class represents a File opend by Silex,
 *   which is rendered by the Stage class
 *   It has methods to manipulate the File
 *
 */


goog.require('silex.model.ModelBase');
goog.provide('silex.model.File');
goog.require('silex.Config');
goog.require('silex.service.SilexTasks');


/**
 * @constructor
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.model.File = function(bodyElement, headElement) {
  // call super
  goog.base(this, bodyElement, headElement);
};

// inherit from silex.model.ModelBase
goog.inherits(silex.model.File, silex.model.ModelBase);


/**
 * name of the new file template
 */
silex.model.File.CREATION_TEMPLATE = 'creation-template.html';


/**
 * current file url
 * if the current file is a new file, it has no url
 */
silex.model.File.prototype.url;


/**
 * build the html content
 * Parse the raw html and fill the bodyElement and headElement
 */
silex.model.File.prototype.setHtml = function(rawHtml) {
  var bodyHtml, headHtml;

  // use lower case to find head and body tags
  var lowerCaseHtml = rawHtml.toLowerCase();
  // split head and body tags
  var headOpenIdx = lowerCaseHtml.indexOf('<head>');
  if (headOpenIdx === -1) headOpenIdx = lowerCaseHtml.indexOf('<head ');
  var headCloseIdx = lowerCaseHtml.indexOf('</head>');
  var bodyOpenIdx = lowerCaseHtml.indexOf('<body>');
  if (bodyOpenIdx === -1) bodyOpenIdx = lowerCaseHtml.indexOf('<body ');
  var bodyCloseIdx = lowerCaseHtml.indexOf('</body>');

  if (headOpenIdx > -1 && headCloseIdx > -1) {
    // look for the first ">" after "<head"
    var closingTagIdx = lowerCaseHtml.indexOf('>', headOpenIdx);
    // extract the head section
    headHtml = rawHtml.substring(closingTagIdx + 1, headCloseIdx);
  }
  if (bodyOpenIdx > -1 && bodyCloseIdx > -1) {
    // look for the first ">" after "<body"
    var closingTagIdx = lowerCaseHtml.indexOf('>', bodyOpenIdx);
    // extract the body section
    //bodyHtml = rawHtml.substring(closingTagIdx + 1, bodyCloseIdx);
  }
  // extract the hole body with body tags
  var bodyHtml = rawHtml.substring(bodyOpenIdx, bodyCloseIdx + 7);
  // deal with absolute urls
  if (this.getUrl()){
    var baseUrl = silex.utils.Url.getBaseUrl(this.getUrl());
    bodyHtml = silex.utils.Url.relative2absolute(bodyHtml, baseUrl);
  }
  // update model
  // cleanup
  silex.utils.EditablePlugin.setEditable(this.bodyElement, false);
  // set html
  this.bodyElement.innerHTML = bodyHtml;
  // body style
  var styleStart = bodyHtml.indexOf('"');
  var styleEnd = bodyHtml.indexOf('"', styleStart + 1);
  var bodyStyle = bodyHtml.substring(styleStart + 1, styleEnd);
  // set body style
  this.bodyElement.setAttribute('style', bodyStyle);
  // make editable again
  silex.utils.EditablePlugin.setEditable(this.bodyElement, true, true);
  // set head content
  this.headElement.innerHTML = headHtml;

};


/**
 * build a string of the raw html content
 * use the bodyTag and headTag objects
 */
silex.model.File.prototype.getHtml = function() {
  // cleanup
  silex.utils.EditablePlugin.setEditable(this.bodyElement, false);
  // get html
  var bodyStr = this.bodyElement.innerHTML;
  // make editable again
  silex.utils.EditablePlugin.setEditable(this.bodyElement, true, true);
  // handle the body style
  var styleStr = this.bodyElement.getAttribute('style') || '';

  // retruns the html page
  var html = '';
  html += '<html>';
  html += '<head>' + this.headElement.innerHTML + '</head>';
  html += '<body style="' + styleStr + '">' + bodyStr + '</body>';
  html += '</html>';

  // return relative urls when possible
  if (this.getUrl()){
    var baseUrl = silex.utils.Url.getBaseUrl(this.getUrl());
    html = silex.utils.Url.absolute2Relative(html, baseUrl);
  }

  return html;
};


/**
 * load an empty new file
 */
silex.model.File.prototype.newFile = function(cbk, opt_errCbk) {
  this.openFromUrl(silex.model.File.CREATION_TEMPLATE, cbk, opt_errCbk);
};


/**
 * load an arbitrary url as a silex html file
 * will not be able to save
 */
silex.model.File.prototype.openFromUrl = function(url, cbk, opt_errCbk) {
  silex.service.CloudStorage.getInstance().loadLocal(url,
      goog.bind(function(rawHtml) {
        this.setUrl(null);
        if (cbk) cbk(rawHtml);
      }, this), opt_errCbk);
};


/**
 * save a file with a new name
 */
silex.model.File.prototype.saveAs = function(url, rawHtml, cbk, opt_errCbk) {
  // save the data
  this.setUrl(url);
  this.save(rawHtml, cbk, opt_errCbk);
};


/**
 * write content to the file
 */
silex.model.File.prototype.save = function(rawHtml, cbk, opt_errCbk) {
  silex.service.CloudStorage.getInstance().save(
    this.getUrl(),
    rawHtml,
    function() {
      if (cbk) cbk();
    },
    opt_errCbk);
};


/**
 * load a new file
 */
silex.model.File.prototype.open = function(url, cbk, opt_errCbk) {
  silex.service.CloudStorage.getInstance().load(
    url,
    goog.bind(function(rawHtml) {
      // update model
      this.close();
      this.setUrl(url);
      if (cbk) cbk(rawHtml);
    }, this), opt_errCbk);
};


/**
 * reset data, close file
 */
silex.model.File.prototype.close = function() {
  this.url = null;
};


/**
 * get the url of the file
 * @param    head     an HtmlDom element containing a new version of the head tag
 */

silex.model.File.prototype.getUrl = function() {
  // revert to relative URL
  if (this.url){
    var baseUrl = silex.utils.Url.getBaseUrl();
    this.url = silex.utils.Url.getRelativePath(this.url, baseUrl);
  }
  return this.url;
};


/**
 * store url of this file
 * @param    head     an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.setUrl = function(url) {
  if (url){
    var baseUrl = silex.utils.Url.getBaseUrl();
    url = silex.utils.Url.getAbsolutePath(url, baseUrl);
  }
  this.url = url;
};


/**
 * publish the file to a folder
 */
silex.model.File.prototype.publish = function(url, cbk, opt_errCbk) {
  console.log('publish to ', url);

  this.cleanup(
      goog.bind(function(html, css, js, files) {
        silex.service.SilexTasks.getInstance().publish(url, html, css, js, files, cbk, opt_errCbk);
      }, this),
      goog.bind(function(error) {
        console.error('publish cleanup error', error);
        if (opt_errCbk) {
          opt_errCbk(error);
        }
      }, this));
};


/**
 * cleanup html page
 * remove Silex specific data from HTML
 * create an external CSS file
 * generates a list of js scripts and assets to be eported with the file
 * @return
 */
silex.model.File.prototype.cleanup = function(cbk, opt_errCbk) {
  // handle background url of the body style
  var styleStr = this.bodyElement.getAttribute('style') || '';
  // cleanup
  silex.utils.EditablePlugin.setEditable(this.bodyElement, false);
  // get html
  var bodyStr = '<body style="' + styleStr + '">' + this.bodyElement.innerHTML + '</body>';
  // make editable again
  silex.utils.EditablePlugin.setEditable(this.bodyElement, true);
  // head
  var headStr = this.headElement.innerHTML;

  // list of css and files (assets, scripts...)
  var cssArray = [];
  var files = [];

  // **
  // get all files and put them into assets/ or scripts/
  if (!this.getUrl()) {
    if (opt_errCbk) {
      opt_errCbk({
        message: 'The file must be saved before I can clean it up for you.'
      });
    }
    return;
  }
  // images to download and put to assets/
  var baseUrl = silex.utils.Url.getBaseUrl(this.getUrl());  // image source
  bodyStr = bodyStr.replace(/<img[^"]*src="?([^" ]*)"/g, function(match, group1, group2) {
    var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
    var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
    console.log(arguments, relative, absolute);
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.utils.Url.isAbsoluteUrl(relative)) {
      relative = relative.replace('../', '/');
    }
    var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
    var newRelativePath = 'assets/' + fileName;
    files.push({
      url: absolute
      , destPath: newRelativePath
      , srcPath: relative
    });
    var res = match.replace(group1, newRelativePath);
    return res;
  });
  // background-image / url(...)
  bodyStr = bodyStr.replace(/url\(()(.+?)\1\)/g, goog.bind(function(match, group1, group2) {
    return this.filterBgImage(baseUrl, files, match, group1, group2);
  }, this));
  // css to download and put to css/
  headStr = headStr.replace(/href="?([^" ]*)"/g, function(match, group1, group2) {
    var preventDownload = false;
    var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
    var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.utils.Url.isAbsoluteUrl(relative)) {
      relative = relative.replace('../', '/');
    }
    else {
      // only allowed domains
      if (absolute.indexOf('http://static.silex.me') !== 0) {
        preventDownload = true;
      }
    }
    if (!preventDownload) {
      var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
      var newRelativePath = 'css/' + fileName;
      files.push({
        url: absolute
        , destPath: newRelativePath
        , srcPath: relative
      });
      var res = match.replace(group1, newRelativePath);
      return res;
    }
    return match;
  });
  // scripts to download and put to js/
  headStr = headStr.replace(/src="?([^"]*)"/g, function(match, group1, group2) {
    var preventDownload = false;
    var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
    var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.utils.Url.isAbsoluteUrl(relative)) {
      relative = relative.replace('../', '/');
    }
    else {
      // only allowed domains
      if (absolute.indexOf('http://static.silex.me') !== 0) {
        preventDownload = true;
      }
    }
    if (!preventDownload) {
      var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
      var newRelativePath = 'js/' + fileName;
      files.push({
        url: absolute
        , destPath: newRelativePath
        , srcPath: relative
      });
      var res = match.replace(group1, newRelativePath);
      return res;
    }
    return match;
  });

  // build a clean body clone
  var bodyElement = goog.dom.createElement('div');
  bodyElement.innerHTML = bodyStr;
  // insert couchcms tags inside containers
  var elements = goog.dom.getElementsByClass('couchcms-element', bodyElement);
  var editableName;
  goog.array.forEach(elements, function(element) {
    console.log('couchcms container', element);
    var couchcmsType;
    switch(element.getAttribute(silex.model.Element.TYPE_ATTR)){
      case silex.model.Element.TYPE_TEXT:
        couchcmsType = "richtext";
        editableName = couchcmsType+"_"+goog.dom.getTextContent(element);
        var elementInnerHTML = element.innerHTML;
        editableName = editableName.replace(/\W/g, '');
        if (editableName.length>30) editableName = editableName.substr(0, 30);
        element.innerHTML = "<cms:editable name='"+editableName+"' type='"+couchcmsType+"'>"+elementInnerHTML+"</cms:editable>";
        break;
      case silex.model.Element.TYPE_HTML:
        couchcmsType = "textarea";
        editableName = couchcmsType+"_"+goog.dom.getTextContent(element);
        var elementInnerHTML = element.innerHTML;
        editableName = editableName.replace(/\W/g, '');
        if (editableName.length>30) editableName = editableName.substr(0, 30);
        element.innerHTML = "<cms:editable no_xss_check='1' name='"+editableName+"' type='"+couchcmsType+"'>"+elementInnerHTML+"</cms:editable>";
        break;
      case silex.model.Element.TYPE_IMAGE:
        couchcmsType = "image";
        var img = goog.dom.getElementsByTagNameAndClass('img', null, element)[0];
        editableName = couchcmsType+"_"+img.getAttribute('src');
        editableName = editableName.replace(/\W/g, '');
        if (editableName.length>30) editableName = editableName.substr(0, 30);
        img.setAttribute('src', "__TO_BE_REPLACED_START__"+editableName+"__TO_BE_REPLACED_END__");
        break;
    }
  }, this);

  // head
  var headElement = goog.dom.createElement('div');
  headElement.innerHTML = headStr;
  $('meta[name="publicationPath"]', headElement).remove();

  // **
  // replace internal links <div data-silex-href="..." by <a href="..."
  // do a first pass, in order to avoid replacing the elements in the <a> containers
  var components = goog.dom.getElementsByClass('editable-style', bodyElement);
  goog.array.forEach(components, function(element) {
    var href = element.getAttribute('data-silex-href');
    if (href)
    {
      element.setAttribute('href', href);
      element.removeAttribute('data-silex-href');

      // create a clone with a different tagname
      var outerHtml = goog.dom.getOuterHtml(element);
      outerHtml = '<a' + outerHtml.substring(4, outerHtml.length - 6) + '</a>'; // 4 is for <div and 6 for </div>

      // insert the clone at the place of the original and remove the original
      var fragment = goog.dom.htmlToDocumentFragment(outerHtml);
      goog.dom.insertSiblingBefore(fragment, element);
      goog.dom.removeNode(element);

      // store the reference to the new node
      element = fragment;
    }
  }, this);
  // **
  // URLs
  /* better than to replace in the html string: goes through each node
does not work because
this does nothing: node.style.backgroundImage = "url('" + info.destPath + "')";

    // apply body style
    var s = silex.utils.Style.stringToStyle(this.stage.getBodyStyle());
    goog.object.forEach(s, function(val, index, obj) {
      if(val) goog.style.setStyle(bodyElement, index, val);
    }, this);

    var components = goog.dom.getElementsByTagNameAndClass(null, null, bodyElement);
    goog.array.forEach(components, function(node) {
      console.info(node.nodeType, node.nodeName)
      files.concat(this.handleNodeUrls(node, baseUrl));
    }, this);
    // handle also the body
    files.concat(this.handleNodeUrls(bodyElement, baseUrl));
  */

  // **
  // extract the elements styles to external .css file
  var elements = goog.dom.getElementsByClass('editable-style', bodyElement);
  var elementIdx = 0;
  goog.array.forEach(elements, function(element) {
    // add the element type
    var classNameType = 'silex-' + element.getAttribute(silex.model.Element.TYPE_ATTR);
    goog.dom.classes.add(element, classNameType);
    // create a class name for this css
    var className = 'element-' + (elementIdx++);
    goog.dom.classes.add(element, className);
    // add the css for this context
    var cssNormal = element.getAttribute('style');
    cssArray.push({
      classNames: ['.' + className]
            , styles: cssNormal
    });
    // cleanup styles used during edition
    goog.dom.classes.remove (element, 'editable-style');
    element.removeAttribute('data-silex-type');
    // remove inline css styles
    element.removeAttribute('style');
  }, this);

  // todo: find patterns to reduce the number of css classes
  // final css
  var cssStr = '';
  goog.array.forEach(cssArray, function(cssData) {
    var elementCssStr = '';
    // compute class names
    goog.array.forEach(cssData.classNames, function(className) {
      if (elementCssStr != '') elementCssStr += ', ';
      elementCssStr += className;
    }, this);
    // compute styles
    elementCssStr += '{\n\t' + cssData.styles + '\n}';
    cssStr += '\n' + elementCssStr;
  }, this);
  // format css
  cssStr.replace('; ', ';\n\t');
  // add head css
  var cssTag = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_ID,
    headElement);
  if (cssTag){
    cssStr += cssTag.innerHTML;
    goog.dom.removeNode(cssTag);
  }

  // js script
  var jsString = '';
  var scriptTag = goog.dom.getElementByClass(
    silex.model.Head.SILEX_SCRIPT_ELEMENT_ID,
    headElement);
  if (scriptTag){
    jsString = scriptTag.innerHTML;
    goog.dom.removeNode(scriptTag);
  }

  // final html page
  var html = '';
  var bodyElementStr = bodyElement.innerHTML;
  bodyElementStr = bodyElementStr.replace(/__TO_BE_REPLACED_START__/g, "<cms:editable name='");
  bodyElementStr = bodyElementStr.replace(/__TO_BE_REPLACED_END__/g, "' type='image' />");
  html += "<?php require_once( 'couch/cms.php' ); ?><cms:template title='"+goog.dom.getElementsByTagNameAndClass('title', null, this.headElement)[0].innerHTML+"' /><html>";
  html += '<head>\
      ' + headElement.innerHTML + '\
      <link href="css/styles.css" rel="stylesheet">\
      <script src="js/script.js" type="text/javascript"></script>\
  </head>';
  html += '<body>' + bodyElementStr + '</body>';
  html += '</html><?php COUCH::invoke(); ?>';

  // callback
  cbk(html, cssStr, jsString, files);
};
silex.model.File.prototype.filterBgImage = function(baseUrl, files, match, group1, group2) {
  // remove the ''
  if (group2.indexOf("'") === 0) group2 = group2.substr(1);
  if (group2.lastIndexOf("'") === group2.length-1) group2 = group2.substr(0, group2.length-1);
  var absolute = silex.utils.Url.getAbsolutePath(group2, baseUrl);
  var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
  // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
  if (!silex.utils.Url.isAbsoluteUrl(relative)) {
    relative = relative.replace('../', '/');
  }
  var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
  var newRelativePath = 'assets/' + fileName;
  var res = "url('../" + newRelativePath + "')";
  files.push({
    url: absolute
    , destPath: newRelativePath
    , srcPath: relative
  });
  return res;
};
/**
 * Determine what to do with a node in function of the URLs it carries
 *
 * @param     {Element} node    the node
 * @return    {array} an array of info about the URLs of the element,
 *     which will be served locally.
 *     This objects in this array have these parameters
 *     - url: the absolute url
 *     - destPath: the destination path (local, relative to the published file)
 *     - srcPath: the source path or relative URL (relative to the current file)
 *
silex.model.File.prototype.handleNodeUrls = function (node, baseUrl) {
  var filesToBeServedLocally = [];
  switch (node.nodeName){
    case 'IMG':
      // get the ressource URL
      var url = node.getAttribute('src');
      // det if it should be served locally
      var info = this.getPublicationInfo(url, baseUrl, 'assets/');
      if (info) {
        // store the publication info
        filesToBeServedLocally.push(info);
        // update with local path
        node.setAttribute('src', info.destPath);
      }
      break;
  }
  // background-image / url(...)
  if (node.style.backgroundImage){
    // get the ressource URL
    var url = node.style.backgroundImage;
    url = url.substr(url.indexOf('url(') + 4);
    url = url.substring(0, url.lastIndexOf(')'));
    // det if it should be served locally
    // (../ because it is relative to css/style.css)
    var info = this.getPublicationInfo(url, baseUrl, '../assets/');
    if (info) {
      // store the publication info
      filesToBeServedLocally.push(info);
      // update with local path
      //bug: do nothing:
      node.style.backgroundImage = "url('" + info.destPath + "')";
      //goog.style.setStyle(node, 'background-image', "xxxurl('xxxxx" + info.destPath + "')");
      //node.style.backgroundImage = undefined;
      //goog.style.setStyle(node, 'background-image', undefined);
      console.warn('replace', info.destPath, node.style.backgroundImage)
    }
  }
  return filesToBeServedLocally;
}
/**
 * Determine if the ressource with the given URL can be downloaded
 *     and served locally after publish is done
 * @param     {string} url    the URL of the ressource
 * @return    {object} the info about the object if it is possible,
 *     or null otherwise. This object has these parameters
 *     - url: the absolute url
 *     - destPath: the destination path (local, relative to the published file)
 *     - srcPath: the source path or relative URL (relative to the current file)
 *
silex.model.File.prototype.getPublicationInfo = function (url, baseUrl, localFolder) {
  var absolute = silex.utils.Url.getAbsolutePath(url, baseUrl);
  var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
  // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
  if (!silex.utils.Url.isAbsoluteUrl(relative)) {
      relative = relative.replace('../', '/');
  }
  var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
  var newRelativePath = localFolder + fileName;
  var res = {
      url: absolute
      , destPath: newRelativePath
      , srcPath: relative
  };
  return res;
}
/* */
