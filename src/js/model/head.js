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
 * @fileoverview
 *   This class represents a the head section of the opened file,
 *   which is rendered by the Stage class
 *   It has methods to manipulate the dom
 *
 *   All model classes are singletons
 */


goog.provide('silex.model.Head');

goog.require('silex.Config');
goog.require('silex.types.Model');



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
 * css class which marks the temporary tags, i.e. the tags inserted while editing a file
 * only for tags in the head section
 */
silex.model.Head.SILEX_TEMP_TAGS_CSS_CLASS = 'silex-temp-tag';


/**
 * css class which marks the tags added to load a custom font
 */
silex.model.Head.CUSTOM_FONTS_CSS_CLASS = 'silex-custom-font';


/**
 * set/get silex editable js scripts
 * @return {string} the string defining the js script
 */
silex.model.Head.prototype.getHeadScript = function() {
  // get silex scripts from the DOM
  var scriptTag = goog.dom.getElementByClass(
      silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS,
      this.getHeadElement());
  if (!scriptTag) {
    console.warn('no silex editable script defined');
    return '';
  }
  return scriptTag.innerHTML;
};


/**
 * set/get silex editable js script
 * @param {string} jsString   the string defining Silex script
 */
silex.model.Head.prototype.setHeadScript = function(jsString) {
  var scriptTag = goog.dom.getElementByClass(
      silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS,
      this.getHeadElement());

  if (!scriptTag) {
    scriptTag = goog.dom.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.className = silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS;
    goog.dom.appendChild(this.getHeadElement(), scriptTag);
  }
  scriptTag.innerHTML = jsString;
};


/**
 * set/get silex editable css styles
 * @return {string} the css string defining all Silex styles
 */
silex.model.Head.prototype.getHeadStyle = function() {
  // get silex styles from the DOM
  var silexStyle = goog.dom.getElementByClass(
      silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
      this.getHeadElement());
  if (!silexStyle) {
    console.warn('no silex editable styles defined');
    return '';
  }
  return silexStyle.innerHTML;
};


/**
 * set/get silex editable css styles
 * @param {string} cssString   the css string defining all Silex styles
 */
silex.model.Head.prototype.setHeadStyle = function(cssString) {
  var silexStyle = goog.dom.getElementByClass(
      silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
      this.getHeadElement());

  if (!silexStyle) {
    silexStyle = goog.dom.createElement('style');
    silexStyle.type = 'text/css';
    silexStyle.className = silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS;
    goog.dom.appendChild(this.getHeadElement(), silexStyle);
  }
  silexStyle.innerHTML = cssString;
  // refresh the text editor's styles
  this.view.textEditor.setCustomCssStyles(cssString);
};


/**
 * refresh the list of loaded fonts. When a user changes the font family
 * of a text, the corresponding font file is loaded if available
 */
silex.model.Head.prototype.refreshFontList = function(neededFonts) {
  var head = this.getHeadElement();
  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByClass(silex.model.Head.CUSTOM_FONTS_CSS_CLASS, head);
  goog.array.forEach(links, function(link) {
    link.parentNode.removeChild(link);
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
    for (let fontName in availableFonts) {
      if (availableFonts[fontName].value === fontFamily)
        return availableFonts[fontName];
    }
    return null;
  };
  var customFontsForTextEditor = [];
  //for each used font family, if a corresponding font is available, load it
  for (let fontFamily in neededFonts) {

    var font = getFont(fontFamily);
    //check that a URL to load is available. There is none for system font (serif, sans-serif...)
    if (font && font.href) {

      //load the font by appending a link, which will load a CSS file containing the
      //font rules
      var link = goog.dom.createElement('link');
      link.setAttribute('href', font.href);
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');
      link.setAttribute('class', silex.model.Head.CUSTOM_FONTS_CSS_CLASS);

      head.appendChild(link);

      customFontsForTextEditor.push({
        name: fontFamily,
        href: font.href
      });
    }
  }
  // refresh the font list in the text editor
  this.view.textEditor.setCustomFonts(customFontsForTextEditor);
};


/**
 * get/set the publication path
 */
silex.model.Head.prototype.setPublicationPath = function(path) {
  var found = false;
  // update the DOM element
  var metaNode = goog.dom.getFrameContentDocument(this.iframeElement).querySelector('meta[name="publicationPath"]');
  if (!metaNode && path && path !== '') {
    // create the DOM element
    metaNode = goog.dom.createElement('meta');
    metaNode.name = 'publicationPath';
    metaNode.content = path;
    goog.dom.appendChild(this.getHeadElement(), metaNode);
  }
  else {
    if (path && path !== '') {
      // update path
      metaNode.setAttribute('content', path);
    }
    else {
      // remove the path
      goog.dom.removeNode(metaNode);
    }
  }
  this.view.settingsDialog.redraw(path);
};


/**
 * get/set the publication path
 * @return {?string}   the publication path
 */
silex.model.Head.prototype.getPublicationPath = function() {
  var metaNode = goog.dom.getFrameContentDocument(this.iframeElement).querySelector('meta[name="publicationPath"]');
  if (metaNode) {
    return metaNode.getAttribute('content');
  }
  else {
    return null;
  }
};


/**
 * website title
 */
silex.model.Head.prototype.getTitle = function() {
  var titleNodes = goog.dom.getElementsByTagNameAndClass('title', null, this.getHeadElement());
  if (titleNodes.length > 0) {
    return titleNodes[0].innerHTML;
  }
  else {
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
  if (titleNodes.length === 0) {
    titleNode = goog.dom.createElement('title');
    goog.dom.appendChild(this.getHeadElement(), titleNode);
  }
  else {
    titleNode = titleNodes[0];
  }
  // update website title
  titleNode.innerHTML = name;
  // update view
  var pages = this.model.page.getPages();
  var page = this.model.page.getCurrentPage();
  this.view.menu.redraw(this.model.body.getSelection(), goog.dom.getFrameContentDocument(this.iframeElement), pages, page);
};


/**
 * @return  {Element}   head element of the loaded site
 */
silex.model.Head.prototype.getHeadElement = function() {
  var contentDocument = goog.dom.getFrameContentDocument(this.iframeElement);
  if (!contentDocument || !contentDocument.head) {
    return null;
  }
  // returns the head of the document in the iframe
  return contentDocument.head;
};


/**
 * load temp tags (js and css) to be removed later
 * @param {Array.<Element>|Element} tags the tag(s) to add
 * @param {?function()=} opt_onSuccess
 * @param {?function()=} opt_onError
 */
silex.model.Head.prototype.addTempTag = function(tags, opt_onSuccess, opt_onError) {
  var tagsWichSupportOnload = ['link', 'script'];
  if (typeof(tags) === 'string') {
    // convert tags to an array
    tags = [tags];
  }
  // onload callback
  var onload = goog.bind(function() {
    if (tags.length > 0) {
      addNextTag();
    }
    else {
      if (opt_onSuccess) opt_onSuccess();
    }
  }, this);
  // nex tag function
  var addNextTag = goog.bind(function() {
    var tag = tags.shift();
    if (goog.array.contains(tagsWichSupportOnload, tag.tagName.toLowerCase())) {
      // use onload
      tag.onload = onload;
    }
    else {
      // no onload for this kind of tags, load right away
      onload();
    }
    tag.onerror = function() {
      console.error('scripts loading error');
      if (opt_onError) opt_onError();
    };
    goog.dom.classlist.add(tag, silex.model.Head.SILEX_TEMP_TAGS_CSS_CLASS);
    goog.dom.appendChild(this.getHeadElement(), tag);
  }, this);
  // start the loading process: call next tag
  if (tags.length > 0) {
    addNextTag();
  }
  else {
    if (opt_onError) opt_onError();
  }
};


/**
 * remove temp tags
 */
silex.model.Head.prototype.removeTempTags = function(opt_headElement) {
  if (!opt_headElement) opt_headElement = this.getHeadElement();
  // remove tags marked as silex-temp-tag
  var tags = goog.dom.getElementsByTagNameAndClass(null, silex.model.Head.SILEX_TEMP_TAGS_CSS_CLASS, opt_headElement);
  goog.array.forEach(tags, function(tag) {
    goog.dom.removeNode(tag);
  });
};
