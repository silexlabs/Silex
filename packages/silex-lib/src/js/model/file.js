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
 *   All model classes are singletons
 */

goog.provide('silex.model.File');
goog.require('silex.Config');
goog.require('silex.service.SilexTasks');


/**
 * @constructor
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Model} model  model class which holds the other models
 */
silex.model.File = function(model, view) {
  this.model = model;
  this.view = view;
};


/**
 * name of the new file template
 */
silex.model.File.CREATION_TEMPLATE = 'creation-template.html';


/**
 * List of URLs from which we are allowed to download the content locally
 * during the process of publishing the file
 * This is made to prevent trying to download locally fonts from google fonts
 * or scripts from an embed code
 */
silex.model.File.DOWNLOAD_LOCALLY_FROM = [
  'http://static.silex.me'
  , silex.utils.Url.getRootUrl()
];


/**
 * current file url
 * if the current file is a new file, it has no url
 * if set, this is an absolute URL, use silex.model.File::getUrl to get the relatvie URL
 */
silex.model.File.prototype.url = null;


/**
 * true if the temp tags used for edition
 * have been loaded once already in the iframe
 * this is because the second time, no load event is catched
 */
silex.model.File.prototype.hasLoadedTmpTags = false;


/**
 * build the html content
 * Parse the raw html and fill the bodyElement and headElement
 */
silex.model.File.prototype.setHtml = function(rawHtml, opt_cbk) {
  var iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  // loading
  goog.dom.classes.add(iframeElement.parentNode, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
  // cleanup
  this.model.body.setEditable(contentDocument.body, false);
  this.view.stage.removeEvents(contentDocument.body);
  // when the iframe content has changed
  goog.events.listenOnce(iframeElement, 'load', function(e) {
    // remove the "silex-runtime" css class from the body while editing
    goog.dom.classes.remove(contentDocument.body, 'silex-runtime');
    // include edition tags and call onContentLoaded
    // the first time, it takes time to load the scripts
    // the second time, no load event, and jquery is already loaded
    if (!iframeElement.contentWindow.jQuery){
      // first time in chrome, and always in firefox
      // load scripts for edition in the iframe
      this.includeEditionTags(goog.bind(function (){
        this.onContentLoaded(opt_cbk);
      }, this), goog.bind(function () {
        // error loading editable script
        console.error('error loading editable script');
        throw new Error('error loading editable script');
      }, this));
    }
    else{
      // second time in chrome, jquery already loaded
      // call include scripts with no callback
      this.includeEditionTags();
      iframeElement.contentWindow.jQuery(goog.bind(function (){
        this.onContentLoaded(opt_cbk);
      }, this));
    }
  }, false, this);
  // add base tag from the beginning
  // should not be needed since we change all  the URLs to absolute
  // but just in case abs/rel conversion bugs
  if (this.url) rawHtml = rawHtml.replace('<head>', '<head><base class="'+silex.model.Head.SILEX_TEMP_TAGS_CSS_CLASS+'" href="'+this.url+'" target="_blank">')
  // prevent scripts from executing
  rawHtml = rawHtml.replace(/type=\"text\/javascript\"/gi, 'type="text/notjavascript"')
  // convert to absolute urls
  if (this.url){
    rawHtml = silex.utils.Url.relative2Absolute(rawHtml, this.url);
  }
  // write the content
  goog.dom.iframe.writeContent(iframeElement, rawHtml);
};


/**
 * copntent successfully changed in the iframe
 */
silex.model.File.prototype.onContentLoaded = function (opt_cbk) {
  var iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  var contentWindow = goog.dom.getFrameContentWindow(iframeElement);

  if (!goog.dom.classes.has(contentDocument.body, 'pageable-plugin-created')){
    // let the time for the scripts to execute (e.g. pageable)
    setTimeout(goog.bind(function() {
      this.onContentLoaded(opt_cbk);
    }, this), 500);
    return;
  }

  // handle retrocompatibility issues
  silex.utils.BackwardCompat.process(contentDocument);
  // select the body
  this.model.body.setSelection([contentDocument.body]);
  // make editable again
  this.model.body.setEditable(contentDocument.body, true, true);
  // update text editor with the sebsite custom style
  this.model.head.setHeadStyle(this.model.head.getHeadStyle());
  // update site title
  this.model.head.setTitle(this.model.head.getTitle());
  // update the settings dialog
  this.model.head.setPublicationPath(this.model.head.getPublicationPath());
  //update loaded font list, as user might have choose a new one
  var neededFonts = this.model.body.getNeededFonts();
  this.model.head.refreshFontList(neededFonts);
  // restore event listeners
  this.view.stage.initEvents(contentWindow);
  // refresh the view
  var pages = this.model.page.getPages();
  var page = this.model.page.getCurrentPage();
  this.view.pageTool.redraw(this.model.body.getSelection(), contentDocument, pages, page);
  this.view.propertyTool.redraw(this.model.body.getSelection(), contentDocument, pages, page);
  this.view.stage.redraw(this.model.body.getSelection(), contentDocument, pages, page);
  if (opt_cbk) opt_cbk();
  // loading
  setTimeout(goog.bind(function() {
    goog.dom.classes.remove(iframeElement.parentNode, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
    // notify the caller
  }, this), 200);
};


/**
 * load all scripts needed for edit and display
 * in the iframe
 */
silex.model.File.prototype.includeEditionTags = function(onSuccess, onError) {
  var iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  // js script tags
  var jQueryScriptTag = contentDocument.createElement('script');
  jQueryScriptTag.type = 'text/javascript';
  jQueryScriptTag.src = silex.utils.Url.getAbsolutePath('libs/jquery/jquery.js', window.location.href);
  var jQueryUiScriptTag = contentDocument.createElement('script');
  jQueryUiScriptTag.type = 'text/javascript';
  jQueryUiScriptTag.src = silex.utils.Url.getAbsolutePath('libs/jquery/jquery-ui.js', window.location.href);
  var pageableScriptTag = contentDocument.createElement('script');
  pageableScriptTag.type = 'text/javascript';
  pageableScriptTag.src = silex.utils.Url.getAbsolutePath('libs/jquery/pageable.js', window.location.href);
  var editableScriptTag = contentDocument.createElement('script');
  editableScriptTag.type = 'text/javascript';
  editableScriptTag.src = silex.utils.Url.getAbsolutePath('libs/jquery/editable.js', window.location.href);
  var frontEndScriptTag = contentDocument.createElement('script');
  frontEndScriptTag.type = 'text/javascript';
  frontEndScriptTag.src = silex.utils.Url.getAbsolutePath('js/front-end.js', window.location.href);
  // css tags
  var editableCssTag = contentDocument.createElement('link');
  editableCssTag.rel = 'stylesheet';
  editableCssTag.href = silex.utils.Url.getAbsolutePath('libs/jquery/editable.css', window.location.href);
  var jQueryUiCoreCssTag = contentDocument.createElement('link');
  jQueryUiCoreCssTag.rel = 'stylesheet';
  jQueryUiCoreCssTag.href = silex.utils.Url.getAbsolutePath('libs/jquery/jquery.ui.core.css', window.location.href);
  var jQueryUiCssTag = contentDocument.createElement('link');
  jQueryUiCssTag.rel = 'stylesheet';
  jQueryUiCssTag.href = silex.utils.Url.getAbsolutePath('libs/jquery/jquery-ui.css', window.location.href);
  // when offline, include these even if they are already in the site
  var frontEndCssTag = contentDocument.createElement('link');
  frontEndCssTag.rel = 'stylesheet';
  frontEndCssTag.href = silex.utils.Url.getAbsolutePath('css/front-end.css', window.location.href);
  var normalizeCssTag = contentDocument.createElement('link');
  normalizeCssTag.rel = 'stylesheet';
  normalizeCssTag.href = silex.utils.Url.getAbsolutePath('libs/normalize.css', window.location.href);
  // load them all
  var tags = [
    jQueryScriptTag,
    jQueryUiScriptTag,
    pageableScriptTag,
    editableScriptTag,
    editableCssTag,
    jQueryUiCoreCssTag,
    jQueryUiCssTag,
    frontEndScriptTag,
    frontEndCssTag,
    normalizeCssTag
  ];
/*
  // add base tag
  // do not do that anymore, since :
  // * the urls are supposed to be absolute
  // * when they are not, the base tag has to be inserted before loading images, see rawHtml.replace above
  if (this.url){
    var baseTag = contentDocument.createElement('base');
    baseTag.target = '_blank';
    baseTag.href = this.url;
    this.model.head.addTempTag(baseTag);
    tags.push(baseTag);
  }
*/
  // do the loading for good
  this.model.head.addTempTag(tags, onSuccess, onError);
}


/**
 * build a string of the raw html content
 * use the bodyTag and headTag objects
 */
silex.model.File.prototype.getHtml = function() {
  var iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  // cleanup
  //this.model.body.setEditable(contentDocument.body, false);
  // clone
  var cleanFile = contentDocument.cloneNode(true);
  // make editable again
  //this.model.body.setEditable(contentDocument.body, true, true);
  // cleanup
  this.model.head.removeTempTags(cleanFile.head);
  this.model.body.removeEditableClasses(cleanFile);
  silex.utils.Style.removeInternalClasses(cleanFile, false, true);
  // reset the style set by stage on the body
  cleanFile.body.style.minWidth = '';
  cleanFile.body.style.minHeight = '';
  // put back the "silex-runtime" css class after editing
  goog.dom.classes.add(cleanFile.body, 'silex-runtime');
  // get html
  var rawHtml = cleanFile.documentElement.innerHTML;
  // put back the scripts
  rawHtml = rawHtml.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"')
  // remove cache control used to refresh images after editing by pixlr
  rawHtml = rawHtml.replace(/([\?|&]silex-cache-control=[0-9]*[&*]?)/gi, goog.bind(function(match, group1, group2) {
    // if there is a ? or & then return ?
    // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
    // aaaaaaaa.com?silex-cache-control=09238734099890
    // aaaaaaaa.com?silex-cache-control=09238734&ccsqcqsc&
    // aaaaaaaa.com?xxx&silex-cache-control=09238734&ccsqcqsc&
    if (group1.charAt(0) === '?' && group1.charAt(group1.length - 1) === '&'){
      return '?';
    }
    else if (group1.charAt(group1.length - 1) === '&' || group1.charAt(0) === '&'){
      return '&';
    }
    else {
      return '';
    }
  }, this));
  // convert to relative urls
  if (this.url){
    rawHtml = silex.utils.Url.absolute2Relative(rawHtml, this.url);
  }
  return rawHtml;
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
    return silex.utils.Url.getRelativePath(this.url, baseUrl);
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
  // get html
  var cleanFileStr = this.getHtml();
  var iframe = goog.dom.iframe.createBlank(goog.dom.getDomHelper(), 'position: absolute; left: -99999px; ');
  goog.dom.appendChild(document.body, iframe);
  // prevent scripts from executing
  cleanFileStr = cleanFileStr.replace(/type=\"text\/javascript\"/gi, 'type="text/notjavascript"')
  // wait untill iframe is ready
  goog.events.listenOnce(iframe, 'load', function(e) {
    var contentDocument = goog.dom.getFrameContentDocument(iframe);
    var headElement = contentDocument.head;
    var bodyElement = contentDocument.body;
    // **
    // remove publication path
    var metaNode = contentDocument.querySelector('meta[name="publicationPath"]');
    if (metaNode){
      goog.dom.removeNode(metaNode);
    }

    // js script
    var jsString = '';
    var scriptTag = goog.dom.getElementByClass(
      silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS,
      headElement);
    if (scriptTag){
      jsString = scriptTag.innerHTML;
      goog.dom.removeNode(scriptTag);
    }
    else {
      console.warn('no silex script found');
    }

    // **
    // final css
    var cssStr = '';
    // list of css and files (assets, scripts...)
    var cssArray = [];
    var files = [];
    var baseUrl = this.url;

    // add head css
    var cssTag = goog.dom.getElementByClass(
      silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
      headElement);
    if (cssTag){
      var tmpStr = cssTag.innerHTML;
      goog.dom.removeNode(cssTag);
      // background-image / url(...)
      tmpStr = tmpStr.replace(/url\(()(.+?)\1\)/gi, goog.bind(function(match, group1, group2) {
        return this.filterBgImage(baseUrl, files, match, group1, group2);
      }, this));
      cssStr += tmpStr;
    }

    // convert to strings
    var bodyStr = bodyElement.innerHTML;
    var headStr = headElement.innerHTML;

    // images to download and put to assets/
    bodyStr = bodyStr.replace(/src="?([^" ]*)"/gi, goog.bind(function(match, group1, group2) {
      var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
      var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
      // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
      if (!silex.utils.Url.isAbsoluteUrl(relative)) {
        relative = '/' + relative;
      }
      if (this.isDownloadable(absolute)){
        var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
        var newRelativePath = 'assets/' + fileName;
        files.push({
          url: absolute
          , destPath: newRelativePath
          , srcPath: relative
        });
        var res = match.replace(group1, newRelativePath);
        return res;
      }
      return match;
    }, this));
    // background-image / url(...)
    bodyStr = bodyStr.replace(/url\(()(.+?)\1\)/gi, goog.bind(function(match, group1, group2) {
      return this.filterBgImage(baseUrl, files, match, group1, group2);
    }, this));
    // handle the body itself
    var oldStyle = bodyElement.getAttribute('style');
    var newStyle = oldStyle.replace(/url\(()(.+?)\1\)/gi, goog.bind(function(match, group1, group2) {
      return this.filterBgImage(baseUrl, files, match, group1, group2);
    }, this));
    bodyElement.setAttribute('style', newStyle);

    // css to download and put to css/
    headStr = headStr.replace(/href="?([^" ]*)"/gi, goog.bind(function(match, group1, group2) {
      var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
      var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
      // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
      if (!silex.utils.Url.isAbsoluteUrl(relative)) {
        relative = '/' + relative;
      }
      if (this.isDownloadable(absolute)){
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
    }, this));
    // scripts to download and put to js/
    headStr = headStr.replace(/src="?([^"]*)"/gi, goog.bind(function(match, group1, group2) {
      var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
      if (this.isDownloadable(absolute)){
        var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
        // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
        if (!silex.utils.Url.isAbsoluteUrl(relative)) {
          relative = '/' + relative;
        }
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
    }, this));

    // build a clean body clone
    bodyElement.innerHTML = bodyStr;
    // cleanup
    silex.utils.Style.removeInternalClasses(bodyElement, false, true);

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
        var newHtml = '<a ';
        if (href.indexOf('#!') !== 0){
          newHtml += 'target="_blank" ';
        }
        newHtml += outerHtml.substring(4, outerHtml.length - 6) + '</a>'; // 4 is for <div and 6 for </div>

        // insert the clone at the place of the original and remove the original
        // FIXME: bug when there is a link in the content of an element with an external link set
        // see issue https://github.com/silexlabs/Silex/issues/56
        var fragment = goog.dom.htmlToDocumentFragment(newHtml);
        var parentNode = element.parentNode;
        goog.dom.insertSiblingBefore(fragment, element);
        goog.dom.removeNode(element);
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
    var cleanupElement = function(element) {
      // add the element type
      var classNameType = 'silex-' + (element.getAttribute(silex.model.Element.TYPE_ATTR) || 'body');
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
      //goog.dom.classes.remove (element, 'editable-style');
      element.removeAttribute('data-silex-type');
      // remove inline css styles
      element.removeAttribute('style');
    };
    // handle body itself
    cleanupElement(bodyElement);
    // handle all other editable elements
    goog.array.forEach(elements, cleanupElement, this);

    // todo: find patterns to reduce the number of css classes
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

    // put back the scripts
    headStr = headStr.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"')
    jsString = jsString.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"')
    bodyStr = bodyElement.innerHTML.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"')
    // handle the body style
    var bodyStyle = bodyElement.getAttribute('style');
    var bodyClass = bodyElement.getAttribute('class');

    // final html page
    var html = '';
    html += '<!DOCTYPE html><html>';
    html += '<head>\
        ' + headStr + '\
        <link href="css/styles.css" rel="stylesheet">\
        <script src="js/script.js" type="text/javascript"></script>\
    </head>';
    html += '<body class="'+bodyClass+' silex-runtime silex-published">' + bodyStr + '</body>';
    html += '</html>';

    // callback
    cbk(html, cssStr, jsString, files);
  }, false, this);
  // write the content (leave this after "listen")
  goog.dom.iframe.writeContent(iframe, cleanFileStr);
};


/**
 * takes a matching pattern "url(...)"" and convert the absolute URLs to relative once,
 * take into account that these will be referenced in css/style.css,
 * so they must be relative to "css/"
 */
silex.model.File.prototype.filterBgImage = function(baseUrl, files, match, group1, group2) {
  // remove the ''
  if (group2.indexOf("'") === 0) group2 = group2.substr(1);
  if (group2.lastIndexOf("'") === group2.length-1) group2 = group2.substr(0, group2.length-1);
  // only if we are supposed to download this url locally
  var absolute = silex.utils.Url.getAbsolutePath(group2, baseUrl);
  var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
  // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
  if (!silex.utils.Url.isAbsoluteUrl(relative)) {
    relative = '/' + relative;
  }
  if (this.isDownloadable(absolute)){
    var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
    var newRelativePath = 'assets/' + fileName;
    var res = "url('../" + newRelativePath + "')";
    files.push({
      url: absolute
      , destPath: newRelativePath
      , srcPath: relative
    });
    return res;
  }
  return match;
};


/**
 * det if a given URL is supposed to be downloaded locally
 * @return true if the url is relative or it is a known domain (sttic.silex.me)
 */
silex.model.File.prototype.isDownloadable = function(url) {
  // do not download files with ? or & since it is probably dynamic
  if (url.indexOf('?') >= 0 || url.indexOf('&') >= 0){
    return false;
  }
  // download relative paths
  if (!silex.utils.Url.isAbsoluteUrl(url)){
    return true;
  }
  // download files from a known domain (sttic.silex.me)
  var found = false;
  goog.array.forEach (silex.model.File.DOWNLOAD_LOCALLY_FROM, function(baseUrl){
    if (url.indexOf(baseUrl) === 0){
      // url starts by the base url, so it is downloadable
      found = true;
    }
  }, this);
  return found;
}



/**
 * Determine what to do with a node in function of the URLs it carries
 *
 * @param     {Element} node    the node
 * @return    {Array} an array of info about the URLs of the element,
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
      //goog.style.setStyle(node, 'background-image', "url('xxxxx" + info.destPath + "')");
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
      relative = '/' + relative;
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
