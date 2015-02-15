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
 * @param  {!silex.types.Model} model  model class which holds the other models
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
 * delimiter for the head tag edited by the user
 */
silex.model.Head.HEAD_TAG_START = '<!-- Silex HEAD tag do not remove -->';


/**
 * delimiter for the head tag edited by the user
 */
silex.model.Head.HEAD_TAG_STOP = '<!-- End of Silex HEAD tag do not remove -->';


/**
 * set/get HEAD tag
 * the head tag edited by the user is a portion of the real head tag
 * it is delimited by specific comments
 * @return {string} the head tag content
 */
silex.model.Head.prototype.getHeadTag = function() {
  // get silex scripts from the DOM
  var headString = this.model.element.unprepareHtmlForEdit(this.getHeadElement().innerHTML);
  var regExp = new RegExp(silex.model.Head.HEAD_TAG_START + '(.*)' + silex.model.Head.HEAD_TAG_STOP);
  var found = headString.match(regExp);
  return found ? found[1] : '';
};


/**
 * set/get HEAD tag
 * the head tag edited by the user is a portion of the real head tag
 * it is delimited by specific comments
 * @param {string} headString
 */
silex.model.Head.prototype.setHeadTag = function(headString) {
  var original = this.model.element.unprepareHtmlForEdit(this.getHeadElement().innerHTML);
  var regExp = new RegExp(silex.model.Head.HEAD_TAG_START + '(.*)' + silex.model.Head.HEAD_TAG_STOP);
  headString = silex.model.Head.HEAD_TAG_START + headString + silex.model.Head.HEAD_TAG_STOP;
  if (regExp.test(original)) {
    // update the head section
    headString = original.replace(regExp, headString)
  }
  else {
    // create the head section
    headString = original + headString;
  }
  this.getHeadElement().innerHTML = this.model.element.prepareHtmlForEdit(headString);
};


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
  return this.model.element.unprepareHtmlForEdit(scriptTag.innerHTML);
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
  scriptTag.innerHTML = this.model.element.prepareHtmlForEdit(jsString);
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
  return this.model.element.unprepareHtmlForEdit(silexStyle.innerHTML);
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
  cssString = this.model.element.prepareHtmlForEdit(cssString);
  silexStyle.innerHTML = cssString;
  // refresh the text editor's styles
  this.view.textEditor.setCustomCssStyles(cssString);
};


/**
 * refresh the list of loaded fonts. When a user changes the font family
 * of a text, the corresponding font file is loaded if available
 * @param {Object.<boolean>} neededFonts the embed fonts found in the website's body
 * @return {Array.<{href: string, name: string}>} font list
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
  return customFontsForTextEditor;
};


/**
 * get/set a meta data
 * @param {string} name
 */
silex.model.Head.prototype.getMeta = function(name) {
  var metaNode = goog.dom.getFrameContentDocument(this.iframeElement)
    .querySelector('meta[name="' + name + '"]');
  if (metaNode) {
    return metaNode.getAttribute('content');
  }
  else {
    return null;
  }
};


/**
 * get/set a meta data
 * @param {string} name
 * @param {?string=} opt_value
 */
silex.model.Head.prototype.setMeta = function(name, opt_value) {
  var found = false;
  // update the DOM element
  var metaNode = goog.dom.getFrameContentDocument(this.iframeElement)
    .querySelector('meta[name="' + name + '"]');
  if (!metaNode && opt_value && opt_value !== '') {
    // create the DOM element
    metaNode = goog.dom.createElement('meta');
    metaNode.name = name;
    metaNode.content = opt_value;
    goog.dom.appendChild(this.getHeadElement(), metaNode);
  }
  else {
    if (opt_value && opt_value !== '') {
      // update opt_value
      metaNode.setAttribute('content', opt_value);
    }
    else {
      // remove the opt_value
      goog.dom.removeNode(metaNode);
    }
  }
};


/**
 * get/set the publication path
 * @param {?string=} opt_path
 */
silex.model.Head.prototype.setPublicationPath = function(opt_path) {
  this.setMeta('publicationPath', opt_path);
  this.view.settingsDialog.setPublicationPath(opt_path);
}


/**
 * get/set the publication path
 */
silex.model.Head.prototype.getPublicationPath = function() {
  return this.getMeta('publicationPath');
};


/**
 * get/set the description
 * @param {?string=} opt_description
 */
silex.model.Head.prototype.setDescription = function(opt_description) {
  this.setMeta('description', opt_description);
  this.view.settingsDialog.setDescription(opt_description);
}


/**
 * get/set the description
 */
silex.model.Head.prototype.getDescription = function() {
  return this.getMeta('description');
};


/**
 * website title
 */
silex.model.Head.prototype.getTitle = function() {
  var titleNode = this.getHeadElement().querySelector('title');
  if (titleNode) {
    return titleNode.innerHTML;
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
  var titleNode = this.getTitle();
  if (!titleNode) {
    titleNode = goog.dom.createElement('title');
    goog.dom.appendChild(this.getHeadElement(), titleNode);
  }
  // update website title
  titleNode.innerHTML = name;
  // update view
  var pages = this.model.page.getPages();
  var page = this.model.page.getCurrentPage();
  this.view.menu.redraw(this.model.body.getSelection(), goog.dom.getFrameContentDocument(this.iframeElement), pages, page);
  this.view.settingsDialog.setTitle(name);
};


/**
 * website favicon
 */
silex.model.Head.prototype.getFaviconPath = function() {
  var faviconTag = this.getHeadElement().querySelector('link[rel="shortcut icon"]');
  if (faviconTag) {
    return faviconTag.getAttribute('href');
  }
  else {
    return null;
  }
};


/**
 * website favicon
 * @param {?string=} opt_path
 */
silex.model.Head.prototype.setFaviconPath = function(opt_path) {
  var faviconTag = this.getHeadElement().querySelector('link[rel="shortcut icon"]');
  if (!faviconTag) {
    if (opt_path) {
      faviconTag = goog.dom.createElement('link');
      faviconTag.setAttribute('href', opt_path);
      faviconTag.setAttribute('rel', 'shortcut icon');
      goog.dom.appendChild(this.getHeadElement(), faviconTag);
    }
  }
  else if(opt_path) {
    goog.dom.removeNode(faviconTag);
  }
  if(opt_path) {
    // update website title
    faviconTag.setAttribute('href', opt_path);
  }
  // update view
  this.view.settingsDialog.setFaviconPath(opt_path);
};


/**
 * get/set the title for social networks
 * @param {?string=} opt_data
 */
silex.model.Head.prototype.setTitleSocial = function(opt_data) {
  this.setMeta('twitter:card', opt_data ? 'summary' : '');
  this.setMeta('twitter:title', opt_data);
  this.setMeta('og:title', opt_data);
  this.view.settingsDialog.setTitleSocial(opt_data);
}


/**
 * get/set the title for social networks
 */
silex.model.Head.prototype.getTitleSocial = function() {
  return this.getMeta('twitter:title') || this.getMeta('og:title');
};


/**
 * get/set the description for social networks
 * @param {?string=} opt_data
 */
silex.model.Head.prototype.setDescriptionSocial = function(opt_data) {
  this.setMeta('twitter:card', opt_data ? 'summary' : '');
  this.setMeta('twitter:description', opt_data);
  this.setMeta('og:description', opt_data);
  this.view.settingsDialog.setDescriptionSocial(opt_data);
}


/**
 * get/set the description for social networks
 */
silex.model.Head.prototype.getDescriptionSocial = function() {
  return this.getMeta('twitter:description') || this.getMeta('og:description');
};


/**
 * get/set the thumbnail image for social networks
 * @param {?string=} opt_data
 */
silex.model.Head.prototype.setThumbnailSocialPath = function(opt_data) {
  this.setMeta('twitter:card', opt_data ? 'summary' : '');
  this.setMeta('twitter:image', opt_data);
  this.setMeta('og:image', opt_data);
  this.view.settingsDialog.setThumbnailSocialPath(opt_data);
}


/**
 * get/set the thumbnail image for social networks
 */
silex.model.Head.prototype.getThumbnailSocialPath = function() {
  return this.getMeta('og:image') || this.getMeta('twitter:image');
};


/**
 * get/set the twitter account
 * @param {?string=} opt_data
 */
silex.model.Head.prototype.setTwitterSocial = function(opt_data) {
  this.setMeta('twitter:card', opt_data ? 'summary' : '');
  this.setMeta('twitter:site', opt_data);
  this.view.settingsDialog.setTwitterSocial(opt_data);
}


/**
 * get/set the twitter account
 */
silex.model.Head.prototype.getTwitterSocial = function() {
  return this.getMeta('twitter:site');
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
