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


goog.provide('silex.model.Head');
goog.require('silex.Config');


/**
 * @constructor
 * Never call this directly nor do new Head,
 * Rather use silex.model.Head.getInstance()
 */
silex.model.Head = function() {
};


/**
 * Singleton pattern
 * reference to the only {silex.model.Head} Head instance of the application
 */
silex.model.Head.instance;


/**
 * Singleton pattern
 * @return {silex.model.Head} a Head instance
 */
silex.model.Head.getInstance = function(neededFonts) {
  if (!silex.model.Head.instance){
    silex.model.Head.instance = new silex.model.Head();
  }
  return silex.model.Head.instance;
};

/**
 * refresh the list of loaded fonts. When a user changes the font family
 * of a text, the corresponding font file is loaded if available
 */
silex.model.Head.prototype.refreshFontList = function() {

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
