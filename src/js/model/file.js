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


goog.provide('silex.model.File');
goog.require('silex.model.Config');



//////////////////////////////////////////////////////////////////
// File class
//////////////////////////////////////////////////////////////////
/**
 * @constructor
 * @param  {silex.view.Workspace}  workspace  reference to the view
 * @param  {silex.view.Menu}  menu  reference to the view
 * @param  {silex.view.Stage}  stage  reference to the view
 * @param  {silex.view.PageTool}  pageTool  reference to the view
 * @param  {silex.view.PropertiesTool}  propertiesTool  reference to the view
 * @param  {silex.view.HtmlEditor}  htmlEditor  reference to the view
 * @param  {silex.view.TextEditor}  textEditor  reference to the view
 * @param  {silex.view.FileExplorer}  fileExplorer  reference to the view
 * @param  {silex.view.PublishSettings}  publishSettings  reference to the view
 */
silex.model.File = function(
    workspace,
    menu,
    stage,
    pageTool,
    propertiesTool,
    htmlEditor,
    textEditor,
    fileExplorer,
    publishSettings) {

  // store references to the view components
  this.workspace = workspace;
  this.menu = menu;
  this.stage = stage;
  this.pageTool = pageTool;
  this.propertiesTool = propertiesTool;
  this.htmlEditor = htmlEditor;
  this.textEditor = textEditor;
  this.fileExplorer = fileExplorer;
  this.publishSettings = publishSettings;
};


/**
 * creation template URL constant
 */
silex.model.File.CREATION_TEMPLATE = 'creation-template.html';


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.workspace;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.menu;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.stage;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.pageTool;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.propertiesTool;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.htmlEditor;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.textEditor;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.fileExplorer;


/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.publishSettings;


/**
 * current file url
 * if the current file is a new file, it has no url
 */
silex.model.File.prototype.url;


/**
 * current file blob
 */
silex.model.File.prototype.blob;


/**
 * current file head content (string)
 */
silex.model.File.prototype.headTag;


/**
 * current file body content (string)
 */
silex.model.File.prototype.bodyTag;


/**
 * current file body style (string)
 */
silex.model.File.prototype.bodyStyle;


////////////////////////////////////////////////
// File management methods
////////////////////////////////////////////////
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
        this.setUrl(url);
        this.setHtml(rawHtml);
        this.setBlob(null); // will not be able to save
        if (cbk) cbk();
      }, this), opt_errCbk);
};


/**
 * save a file with a new name
 */
silex.model.File.prototype.saveAs = function(cbk, opt_errCbk) {
  // choose a new name
  this.fileExplorer.saveAsDialog(
      goog.bind(function(blob) {

        // save the data
        this.setUrl(blob.url);
        this.setBlob(blob);
        this.save(cbk, opt_errCbk);
      }, this),
      {'mimetype': 'text/html'}, 
      ['html', 'htm'],
      opt_errCbk);
  this.workspace.invalidate();
};


/**
 * write content to the file
 */
silex.model.File.prototype.save = function(cbk, opt_errCbk) {
  var blob = this.getBlob();
  this.setBodyTag(this.getStageComponent().getHtml(blob.url));
  this.setHeadTag(this.stage.getHead());
  this.setBodyStyle(this.stage.getBodyStyle());
  silex.service.CloudStorage.getInstance().save(blob, this.getHtml(), function() {
    if (cbk) cbk();
  }, opt_errCbk);
};


/**
 * load a new file
 */
silex.model.File.prototype.open = function(cbk, opt_errCbk) {
  // let the user choose the file
  this.fileExplorer.openDialog(
      goog.bind(function(blob) {
        silex.service.CloudStorage.getInstance().load(blob,
            goog.bind(function(rawHtml) {
              // update model
              this.close();
              this.setUrl(blob.url);
              this.setBlob(blob);
              this.setHtml(rawHtml);
              if (cbk) cbk();
            }, this), opt_errCbk);
      }, this),
      ['text/html', 'text/plain'], 
      ['html', 'htm'],
      opt_errCbk);
  this.workspace.invalidate();
};


/**
 * reset data, close file
 */
silex.model.File.prototype.close = function() {
  this.url = null;
  this.blob = null;
  this.headTag = '';
  this.bodyTag = '';
  this.setHtml('');
  //
  this.stage.setBody('');
  this.stage.setHead('');
  this.stage.setBodyStyle('');
  this.workspace.invalidate();
};


/**
 * refresh the list of loaded fonts. When a user changes the font family
 * of a text, the corresponding font file is loaded if available
 */
silex.model.File.prototype.refreshFontList = function() {

  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByTagNameAndClass('link');
  goog.array.forEach(links, function(link) {
    //fonts are loaded used 'links' element pointing to google fonts service
    if (link.getAttribute('href').indexOf('fonts') !== -1) {
      link.parentNode.removeChild(link);
    }
  });
  var head = this.stage.headElement;
  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByTagNameAndClass('link', null, head);
  goog.array.forEach(links, function(link) {
    //fonts are loaded used 'links' element pointing to google fonts service
    if (link.getAttribute('href').indexOf('fonts') !== -1) {
      link.parentNode.removeChild(link);
    }
  });
  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByTagNameAndClass('link', null, head);
  goog.array.forEach(links, function(link) {
    //fonts are loaded used 'links' element pointing to google fonts service
    if (link.getAttribute('href').indexOf('fonts') !== -1) {
      link.parentNode.removeChild(link);
    }
  });

  var fontFamilies = this.getNeededFonts();

  //text styles can also be applied using old-school font tag.
  //Get face attribute values from them
  var fontTags = goog.dom.getElementsByTagNameAndClass('font', null, head);
  goog.array.forEach(fontTags, function(fontTag) {
    if (null !== fontTag.getAttribute('face')) {
      fontFamilies[fontTag.getAttribute('face')] = true;
    }
  });

  //get authorised fonts
  var availableFonts = silex.model.Config.fonts;
  //return the font from the font family or null
  var getFont = function(fontFamily) {
        for (var fontName in availableFonts) {
      if (availableFonts[fontName].value === fontFamily)
                return availableFonts[fontName];
        }
        return null;
  };

  //for each used font family, if a corresponding font is available, load it
  for (var fontFamily in fontFamilies) {

    var font = getFont(fontFamily);
    //check that a URL to load is available. There is none for system font (serif, sans-serif...)
    if (font && font.href !== undefined) {

      //load the font by appending a link, which will load a CSS file containing the
      //font rules
      var link = goog.dom.createElement('link');
      link.setAttribute('href', font.href);
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');

      head.appendChild(link);

      // for the editor
      var link = goog.dom.createElement('link');
      link.setAttribute('href', font.href);
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');

      document.head.appendChild(link);
    }
  }
};
/**
 * @return {object} object of fonts which are used in the text fields (key is the font name)
 */
silex.model.File.prototype.getNeededFonts = function() {
  var innerHTML = this.getStageComponent().getHtml();
  var neededFonts = [];
  innerHTML.replace(/<font[^"]*face="?([^"]*)"/g, function(match, group1, group2) {
    neededFonts[group1] = true;
    return match;
  });
  return neededFonts;
};


////////////////////////////////////////////////
// DOM related methods
////////////////////////////////////////////////
/**
 * get the HtmlDom element containing the body tag
 */
silex.model.File.prototype.getStageComponent = function() {
  return new silex.model.Component(this.stage.bodyElement);
};


/**
 * get the HtmlDom element containing the body tag
 */
silex.model.File.prototype.getBodyTag = function() {
  return this.bodyTag;
};


/**
 * store new data in memory
 * @param    body     an HtmlDom element containing a new version of the body tag
 */
silex.model.File.prototype.setBodyTag = function(body) {
  this.bodyTag = body;
};


/**
 * get the HtmlDom element containing the head tag
 */
silex.model.File.prototype.getHeadTag = function() {
  return this.headTag;
};


/**
 * store new data in memory
 * @param    head     an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.setHeadTag = function(head) {
  this.headTag = head;
};


/**
 * get the url of the file
 * @param    head     an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.getUrl = function() {
  return this.url;
};


/**
 * store url of this file
 * @param    head     an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.setUrl = function(url) {
  this.url = url;
};


/**
 * get the blob of the file
 */
silex.model.File.prototype.getBlob = function() {
  return this.blob;
};


/**
 * store blob of this file
 */
silex.model.File.prototype.setBlob = function(blob) {
  this.blob = blob;
  // update tools
  if (blob)
    this.propertiesTool.setBaseUrl(blob.url);
  else
    this.propertiesTool.setBaseUrl(null);
};


/**
 * get the string containing the style attribute of the body tag
 */
silex.model.File.prototype.getBodyStyle = function() {
  var absolutePathStyle = this.getStageComponent().relative2absolute(this.bodyStyle, this.getUrl());
  return absolutePathStyle;
};


/**
 * store new data in memory
 * @param    bodyStyle     a string containing the style attribute to set on the body tag
 */
silex.model.File.prototype.setBodyStyle = function(bodyStyle) {
  var relativePathStyle = this.getStageComponent().absolute2Relative(bodyStyle, this.getUrl());
  this.bodyStyle = relativePathStyle;
};


/**
 * build the html content
 * Parse the raw html and set the bodyTag and headTag strings
 */
silex.model.File.prototype.setHtml = function(rawHtml) {
  // reset the previous page model
  var pages = silex.model.Page.getPages();
  while (pages.length > 0) {
    var page = pages[0];
    page.detach();
  }
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
    this.headTag = rawHtml.substring(closingTagIdx + 1, headCloseIdx);
  }
  if (bodyOpenIdx > -1 && bodyCloseIdx > -1) {
    // look for the first ">" after "<body"
    var closingTagIdx = lowerCaseHtml.indexOf('>', bodyOpenIdx);
    // extract the body section
    this.bodyTag = rawHtml.substring(closingTagIdx + 1, bodyCloseIdx);
  }
  // extract body style
  var bodyTag = rawHtml.substring(bodyOpenIdx, bodyCloseIdx + 1);
  var styleStart = bodyTag.indexOf('"');
  var styleEnd = bodyTag.indexOf('"', styleStart + 1);
  this.bodyStyle = bodyTag.substring(styleStart + 1, styleEnd);
  var absolutePathStyle = this.getStageComponent().relative2absolute(this.bodyStyle, this.getUrl());
  this.bodyStyle = absolutePathStyle;

  // update view
  this.getStageComponent().setHtml(this.bodyTag, this.getUrl());
  this.stage.setHead(this.headTag);
  this.stage.setBodyStyle(this.bodyStyle);

  // handle pages of the loaded html
  var pagesNames = this.stage.getPagesNamesFromDom();

  // update model
  goog.array.forEach(pagesNames, function(pageName) {
    var page = new silex.model.Page(
        pageName,
        this.workspace,
        this.menu,
        this.stage,
        this.pageTool,
        this.propertiesTool,
        this.textEditor,
        this.fileExplorer
        );
    // no, because it is allready attached to the stage: page.attach();
    silex.model.Page.addPage(page);
  }, this);

  // update tools
  var pages = silex.model.Page.getPages();
  this.pageTool.setPages(pages);
  this.propertiesTool.setPages(pages);

  // open default page
  this.pageTool.setSelectedIndex(0);

  // update website title
  var title = this.getTitle();
  if (title) {
    this.menu.setWebsiteName(title);
  }
  // update publication settings
  this.setPublicationPath(this.getPublicationPath());

  // update fonts
  this.refreshFontList();

  // handle retrocompatibility issues
  this.handleRetrocompatibility();
};


/**
 * build a string of the raw html content
 * use the bodyTag and headTag objects
 */
silex.model.File.prototype.getHtml = function() {
  // handle background url of the body style
  var styleStr = this.getBodyStyle();

  var html = '';
  html += '<html>';
  html += '<head>' + this.headTag + '</head>';
  html += '<body style="' + styleStr + '">' + this.bodyTag + '</body>';
  html += '</html>';

  return html;
};


////////////////////////////////////////////////
// Website related methods
////////////////////////////////////////////////
/**
 * view this file in a new window
 */
silex.model.File.prototype.view = function() {
  if (!this.getBlob()) {
    alertify.confirm('The file has to be saved first. Save the file now?', goog.bind(function(accept) {
      if (accept) {
        this.saveAs(goog.bind(function() {
          window.open(this.getUrl());
        }, this));
      }
    }, this));
  }
  else {
    window.open(this.getUrl());
  }
};


/**
 * website title
 */
silex.model.File.prototype.getTitle = function() {
  var elements = this.stage.headElement.getElementsByTagName('title');
  if (elements && elements.length > 0) {
    return elements[0].innerHTML;
  }
  else {
    return null;
  }
};


/**
 * website title
 */
silex.model.File.prototype.setTitle = function(name) {
  // update website title
  var elements = this.stage.headElement.getElementsByTagName('title');
  if (elements && elements.length > 0) {
    elements[0].innerHTML = name;
  }
// new website title
  else {
    var child = goog.dom.createElement('title');
    child.innerHTML = name;
    this.stage.headElement.appendChild(child);
  }
  // update menu
  this.menu.setWebsiteName(name);
};


//////////////////////////////////////////////////////////////////
// retrocompatibility process
// called after opening a file
//////////////////////////////////////////////////////////////////
/**
 * handle retrocompatibility issues
 */
silex.model.File.prototype.handleRetrocompatibility = function() {
  var that = this;
  // handle older page system
  $('meta[name="page"]', this.stage.headElement).each(function() {
    // old fashion way to get the name
    var pageName = this.getAttribute('content');
    // create a page object
    var page = new silex.model.Page(
        pageName,
        that.workspace,
        that.menu,
        that.stage,
        that.pageTool,
        that.propertiesTool,
        that.textEditor,
        that.fileExplorer
        );
    console.warn('retro compat in action', this, page);
    // add in new page system
    page.attach();
    // remove the old tag
    $(this).remove();
  });
};


//////////////////////////////////////////////////////////////////
// publication process
// cleanup html and generate assets/ and css/ and js/ folders
// call the silex-task service, publish task
//////////////////////////////////////////////////////////////////
/**
 * get/set the publication path
 */
silex.model.File.prototype.setPublicationPath = function(path) {
  if (path === '') {
    path = null;
  }

  this.publishSettings.setPublicationPath(path);
  this.stage.setPublicationPath(path);
};


/**
 * get/set the publication path
 */
silex.model.File.prototype.getPublicationPath = function() {
  return this.stage.getPublicationPath();
};


/**
 * publish html page
 * cleanup HTML
 * send data to server side export script
 * @return
 */
silex.model.File.prototype.publish = function(cbk, opt_errCbk) {
  if (!this.getPublicationPath()) {
    if (opt_errCbk) {
      opt_errCbk({
        message: 'The publication path must be set before I can clean it up for you.'
      });
    }
    return;
  }
  this.cleanup(
      goog.bind(function(html, css, files) {
        silex.service.SilexTasks.getInstance().publish(this.getPublicationPath(), html, css, files, cbk, opt_errCbk);
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
  // build a clean body clone
  var bodyComponent = this.getStageComponent();
  var bodyStr = bodyComponent.getHtml();

  // head
  var headStr = this.stage.getHead();

  // list of css and files (assets, scripts...)
  var cssArray = [];
  var files = [];

  // **
  // get all files and put them into assets/ or scripts/
  if (!this.getBlob()) {
    if (opt_errCbk) {
      opt_errCbk({
        message: 'The file must be saved before I can clean it up for you.'
      });
    }
    return;
  }
  var baseUrl = this.getBlob().url;
  baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);

  // image source
  bodyStr = bodyStr.replace(/<img[^"]*src="?([^" ]*)"/g, function(match, group1, group2) {
    var absolute = silex.Helper.getAbsolutePath(group1, baseUrl);
    var relative = silex.Helper.getRelativePath(absolute, silex.Helper.BaseUrl);
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.Helper.isAbsoluteUrl(relative)) {
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
  bodyStr = bodyStr.replace(/url\((['"])(.+?)\1\)/g, goog.bind(function(match, group1, group2) {
    return this.filterBgImage(baseUrl, files, match, group1, group2);
  }, this));
  // css
  headStr = headStr.replace(/href="?([^" ]*)"/g, function(match, group1, group2) {
    var preventDownload = false;
    var absolute = silex.Helper.getAbsolutePath(group1, baseUrl);
    var relative = silex.Helper.getRelativePath(absolute, silex.Helper.BaseUrl);
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.Helper.isAbsoluteUrl(relative)) {
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
  // scripts
  headStr = headStr.replace(/src="?([^"]*)"/g, function(match, group1, group2) {
    var preventDownload = false;
    var absolute = silex.Helper.getAbsolutePath(group1, baseUrl);
    var relative = silex.Helper.getRelativePath(absolute, silex.Helper.BaseUrl);
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.Helper.isAbsoluteUrl(relative)) {
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

  // head
  var headElement = goog.dom.createElement('div');
  headElement.innerHTML = headStr;
  $('meta[name="publicationPath"]', headElement).remove();

  // **
  // replace internal links <div data-silex-href="..." by <a href="..."
  // do a first pass, in order to avoid replacing the elements in the <a> containers
  var components = goog.dom.getElementsByClass('editable-style', bodyElement);
  goog.array.forEach(components, function(node) {
    var component = new silex.model.Component(node);
    var href = component.element.getAttribute('data-silex-href');
    if (href)
    {
      component.element.setAttribute('href', href);
      component.element.removeAttribute('data-silex-href');

      // create a clone with a different tagname
      var outerHtml = goog.dom.getOuterHtml(component.element);
      outerHtml = '<a' + outerHtml.substring(4, outerHtml.length - 6) + '</a>'; // 4 is for <div and 6 for </div>

      // insert the clone at the place of the original and remove the original
      var fragment = goog.dom.htmlToDocumentFragment(outerHtml);
      goog.dom.insertSiblingBefore(fragment, component.element);
      goog.dom.removeNode(component.element);

      // store the reference to the new node
      component.element = fragment;
    }
  }, this);
  // **
  // URLs
  /* better that to replace in the html string: goes through each node
does not work because
this does nothing: node.style.backgroundImage = "url('" + info.destPath + "')";

    // apply body style
    var s = silex.Helper.stringToStyle(this.stage.getBodyStyle());
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
  // extract the components styles to external .css file
  var components = goog.dom.getElementsByClass('editable-style', bodyElement);
  var componentIdx = 0;
  goog.array.forEach(components, function(node) {
    var component = new silex.model.Component(node);

    // add the component type
    var classNameType = 'silex-' + component.type;
    component.addClass(classNameType);
    // create a class name for this css
    var className = 'component-' + (componentIdx++);
    component.addClass(className);
    // add the css for this context
    var cssNormal = component.getCss(silex.model.Component.CONTEXT_NORMAL);
    cssArray.push({
      classNames: ['.' + className]
            , styles: cssNormal
    });
    // add the css for this context
    if (component.hasStyle(silex.model.Component.CONTEXT_HOVER)) {
      var cssHover = component.getCss(silex.model.Component.CONTEXT_HOVER);
      cssArray.push({
        classNames: ['.' + className + ':hover']
                , styles: cssHover
      });
    }
    // add the css for this context
    if (component.hasStyle(silex.model.Component.CONTEXT_PRESSED)) {
      var cssPressed = component.getCss(silex.model.Component.CONTEXT_PRESSED);
      cssArray.push({
        classNames: ['.' + className + ':pressed']
                , styles: cssPressed
      });
    }

    // cleanup styles used during edition
    component.removeClass('editable-style');
    component.element.removeAttribute('data-silex-type');
    component.element.removeAttribute('data-silex-sub-type');
    // remove inline css styles
    component.element.removeAttribute('data-style-' + silex.model.Component.CONTEXT_NORMAL);
    component.element.removeAttribute('data-style-' + silex.model.Component.CONTEXT_HOVER);
    component.element.removeAttribute('data-style-' + silex.model.Component.CONTEXT_PRESSED);
    component.element.removeAttribute('style');
  }, this);

  // body style
  var bodyStyleStr = this.stage.getBodyStyle();
  bodyStyleStr = bodyStyleStr.replace(/url\((['"])(.+?)\1\)/g, goog.bind(function(match, group1, group2) {
    return this.filterBgImage(baseUrl, files, match, group1, group2);
  }, this));
  cssArray.push({
    classNames: ['body']
        , styles: silex.Helper.stringToStyle(bodyStyleStr)
  });
  // fixme: find patterns to reduce the number of css classes
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
    elementCssStr += '{\n\t' + silex.Helper.styleToString(cssData.styles) + '\n}';
    cssStr += '\n' + elementCssStr;
  }, this);
  // format css
  cssStr.replace('; ', ';\n\t');

  // final html page
  var html = '';
  html += '<html>';
  html += '<head><link href="css/styles.css" rel="stylesheet">' + headElement.innerHTML + '</head>';
  html += '<body>' + bodyElement.innerHTML + '</body>';
  html += '</html>';

  // callback
  cbk(html, cssStr, files);
};
silex.model.File.prototype.filterBgImage = function(baseUrl, files, match, group1, group2) {
  var absolute = silex.Helper.getAbsolutePath(group2, baseUrl);
  var relative = silex.Helper.getRelativePath(absolute, silex.Helper.BaseUrl);
  // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
  if (!silex.Helper.isAbsoluteUrl(relative)) {
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
  var absolute = silex.Helper.getAbsolutePath(url, baseUrl);
  var relative = silex.Helper.getRelativePath(absolute, silex.Helper.BaseUrl);
  // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
  if (!silex.Helper.isAbsoluteUrl(relative)) {
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
