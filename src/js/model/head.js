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
 */


goog.require('silex.model.ModelBase');
goog.provide('silex.model.Head');
goog.require('silex.Config');


/**
 * @constructor
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.model.Head = function(bodyElement, headElement) {
  // call super
  goog.base(this, bodyElement, headElement);
};

// inherit from silex.model.ModelBase
goog.inherits(silex.model.Head, silex.model.ModelBase);


/**
 * id of the style element which holds silex editable css styles
 */
silex.model.Head.SILEX_STYLE_ELEMENT_ID = 'silex-style';


/**
 * id of the style element which holds silex editable css styles
 */
silex.model.Head.SILEX_SCRIPT_ELEMENT_ID = 'silex-script';


/**
 * set/get silex editable js scripts
 * @return {string} the string defining the js script
 */
silex.model.Head.prototype.getHeadScript = function() {
  // get silex scripts from the DOM
  var scriptTag = goog.dom.getElementByClass(
    silex.model.Head.SILEX_SCRIPT_ELEMENT_ID,
    this.headElement);
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
    silex.model.Head.SILEX_SCRIPT_ELEMENT_ID,
    this.headElement);

  if (!scriptTag){
    scriptTag = goog.dom.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.className = silex.model.Head.SILEX_SCRIPT_ELEMENT_ID;
    goog.dom.appendChild(this.headElement, scriptTag);
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
    silex.model.Head.SILEX_STYLE_ELEMENT_ID,
    this.headElement);
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
    silex.model.Head.SILEX_STYLE_ELEMENT_ID,
    this.headElement);

  if (!silexStyle){
    silexStyle = goog.dom.createElement('style');
    silexStyle.type = 'text/css';
    silexStyle.className = silex.model.Head.SILEX_STYLE_ELEMENT_ID;
    goog.dom.appendChild(this.headElement, silexStyle);
  }
  silexStyle.innerHTML = cssString;
}


/**
 * update the browser style to match silex editable css styles
 */
silex.model.Head.prototype.updateBrowserStyle = function() {
  var silexStyle = goog.dom.getElementByClass(
    silex.model.Head.SILEX_STYLE_ELEMENT_ID,
    document.head);

  // also update Silex editor css
  if (!silexStyle){
    silexStyle = goog.dom.createElement('style');
    silexStyle.type = 'text/css';
    silexStyle.className = silex.model.Head.SILEX_STYLE_ELEMENT_ID;
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
  var head = this.headElement;
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
  $('meta[name="publicationPath"]', this.headElement).each(
      function() {
        if (path && path !== '') {
          // update path
          this.setAttribute('content', path);
        }
        else {
          // remove the path
          $(this).remove();
        }
        found = true;
      });
  if (!found && path && path !== '') {
    // create the DOM element
    var meta = goog.dom.createElement('meta');
    meta.name = 'publicationPath';
    meta.content = path;
    goog.dom.appendChild(this.headElement, meta);
  }
};


/**
 * get/set the publication path
 * @return {string}   the publication path
 */
silex.model.Head.prototype.getPublicationPath = function() {
  var path = null;
  $('meta[name="publicationPath"]', this.headElement).each(
      function() {
        path = this.getAttribute('content');
      });
  return path;
};


/**
 * website title
 */
silex.model.Head.prototype.getTitle = function() {
  var title = null;
  $('title', this.headElement).each(
    function() {
      title = this.innerHTML;
    });
  return title;
};


/**
 * website title
 */
silex.model.Head.prototype.setTitle = function(name) {
  var found = false;
  // update website title
  $('title', this.headElement).each(
      function() {
        this.innerHTML = name;
        found = true;
      });
  if(!found) {
    var title = goog.dom.createElement('title');
    title.innerHTML = name;
    goog.dom.appendChild(this.headElement, title);
  }
};

