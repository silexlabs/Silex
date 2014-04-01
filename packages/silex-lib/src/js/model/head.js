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
 *   This class represents a the head section of the opened file,
 *   which is rendered by the Stage class
 *   It has methods to manipulate the dom
 *
 *   All model classes are singletons
 */


goog.provide('silex.model.Head');

goog.require('silex.types.Model');
goog.require('silex.Config');


/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Head = function(model, view) {
  this.model = model;
  this.view = view;
  // retrieve the element which will hold the body of the opened file
  this.iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
};


/**
 * id of the style element which holds silex editable css styles
 */
silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS = 'silex-style';


/**
 * id of the style element which holds silex editable css styles
 */
silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS = 'silex-script';


/**
 * {Array<Element>} elements to be removed before save
 * these are added by addTempTags
 */
silex.model.Head.prototype.tempTags = [];


/**
 * set/get silex editable js scripts
 * @return {string} the string defining the js script
 */
silex.model.Head.prototype.getHeadScript = function() {
  // get silex scripts from the DOM
  var scriptTag = goog.dom.getElementByClass(
    silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS,
    this.getHeadElement());
  if (!scriptTag){
    console.warn('no silex editable styles defined');
    return '';
  }
  return scriptTag.innerHTML;
}


/**
 * set/get silex editable js script
 * @param {string} jsString   the string defining Silex script
 */
silex.model.Head.prototype.setHeadScript = function(jsString) {
  var scriptTag = goog.dom.getElementByClass(
    silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS,
    this.getHeadElement());

  if (!scriptTag){
    scriptTag = goog.dom.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.className = silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS;
    goog.dom.appendChild(this.getHeadElement(), scriptTag);
  }
  scriptTag.innerHTML = jsString;
}


/**
 * set/get silex editable css styles
 * @return {string} the css string defining all Silex styles
 */
silex.model.Head.prototype.getHeadStyle = function() {
  // get silex styles from the DOM
  var silexStyle = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
    this.getHeadElement());
  if (!silexStyle){
    console.warn('no silex editable styles defined');
    return '';
  }
  return silexStyle.innerHTML;
}


/**
 * set/get silex editable css styles
 * @param {string} cssString   the css string defining all Silex styles
 */
silex.model.Head.prototype.setHeadStyle = function(cssString) {
  var silexStyle = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
    this.getHeadElement());

  if (!silexStyle){
    silexStyle = goog.dom.createElement('style');
    silexStyle.type = 'text/css';
    silexStyle.className = silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS;
    goog.dom.appendChild(this.getHeadElement(), silexStyle);
  }
  silexStyle.innerHTML = cssString;
}


/**
 * update the browser style to match silex editable css styles
 */
silex.model.Head.prototype.updateBrowserStyle = function() {
  var silexStyle = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
    document.head);

  // also update Silex editor css
  if (!silexStyle){
    silexStyle = goog.dom.createElement('style');
    silexStyle.type = 'text/css';
    silexStyle.className = silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS;
    goog.dom.appendChild(document.head, silexStyle);
  }

  silexStyle.innerHTML = this.getHeadStyle();
}


/**
 * refresh the list of loaded fonts. When a user changes the font family
 * of a text, the corresponding font file is loaded if available
 */
silex.model.Head.prototype.refreshFontList = function(neededFonts) {

  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByTagNameAndClass('link');
  goog.array.forEach(links, function(link) {
    //fonts are loaded used 'links' element pointing to google fonts service
    if (link.getAttribute('href').indexOf('fonts') !== -1) {
      link.parentNode.removeChild(link);
    }
  });
  var head = this.getHeadElement();
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

  //text styles can also be applied using old-school font tag.
  //Get face attribute values from them
  var fontTags = goog.dom.getElementsByTagNameAndClass('font', null, head);
  goog.array.forEach(fontTags, function(fontTag) {
    if (null !== fontTag.getAttribute('face')) {
      neededFonts[fontTag.getAttribute('face')] = true;
    }
  });

  //get authorised fonts
  var availableFonts = silex.Config.fonts;
  //return the font from the font family or null
  var getFont = function(fontFamily) {
    for (var fontName in availableFonts) {
      if (availableFonts[fontName].value === fontFamily)
        return availableFonts[fontName];
    }
    return null;
  };

  //for each used font family, if a corresponding font is available, load it
  for (var fontFamily in neededFonts) {

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
 * get/set the publication path
 */
silex.model.Head.prototype.setPublicationPath = function(path) {

  var that = this;
  var found = false;
  // update the DOM element
  var metaNode = goog.dom.findNode(this.getHeadElement(), function (node) {
    return node && node.tagName === 'meta' && node.getAttribute('name') === 'publicationPath';
  });
  if (!metaNode && path && path !== ''){
    // create the DOM element
    metaNode = goog.dom.createElement('meta');
    metaNode.name = 'publicationPath';
    metaNode.content = path;
    goog.dom.appendChild(this.getHeadElement(), metaNode);
  }
  else{
    if (path && path !== '') {
      // update path
      metaNode.setAttribute('content', path);
    }
    else {
      // remove the path
      goog.dom.removeNode(metaNode);
    }
  }
  this.view.settingsDialog.redraw();
};


/**
 * get/set the publication path
 * @return {string}   the publication path
 */
silex.model.Head.prototype.getPublicationPath = function() {
  var metaNode = goog.dom.findNode(this.getHeadElement(), function (node) {
    return node && node.tagName === 'meta' && node.getAttribute('name') === 'publicationPath';
  });
  if (metaNode){
    return metaNode.getAttribute('content');
  }
  else{
    return null
  }
};


/**
 * website title
 */
silex.model.Head.prototype.getTitle = function() {
  var titleNodes = goog.dom.getElementsByTagNameAndClass('title', null, this.getHeadElement());
  if (titleNodes.length > 0){
    return titleNodes[0].innerHTML;
  }
  else{
    return null;
  }
};


/**
 * website title
 */
silex.model.Head.prototype.setTitle = function(name) {
  // find or create the title tag in the head section
  var titleNodes = goog.dom.getElementsByTagNameAndClass('title', null, this.getHeadElement());
  var titleNode;
  if (titleNodes.length === 0){
    titleNode = goog.dom.createElement('title');
    goog.dom.appendChild(this.getHeadElement(), title);
  }
  else{
    titleNode = titleNodes[0];
  }
  // update website title
  titleNode.innerHTML = name;
};


/**
 * @return  {Element}   head element of the loaded site
 */
silex.model.Head.prototype.getHeadElement = function() {
  if (!this.iframeElement || !this.iframeElement.contentDocument || !this.iframeElement.contentDocument.head){
    return null;
  }
  // returns the head of the document in the iframe
  return this.iframeElement.contentDocument.head;
};


/**
 * load temp tags (js and css) to be removed before save
 */
silex.model.Head.prototype.addTempTag = function(tag, opt_onSuccess, opt_onError) {
  tag.onload = function () {
    if(opt_onSuccess) opt_onSuccess();
  }
  tag.onerror = function () {
    if(opt_onError) opt_onError();
  }
  goog.dom.appendChild(this.getHeadElement(), tag);
  this.tempTags.push(tag);
};


/**
 * remove temp tags
 */
silex.model.Head.prototype.removeTempTags = function() {
  goog.array.forEach(this.tempTags, function(tag) {
    goog.dom.removeNode(tag);
  });
};
