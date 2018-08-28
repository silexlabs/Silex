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
  // store the model and the view
  /**
   * @type {silex.types.Model}
   */
  this.model = model;
  /**
   * @type {silex.types.View}
   */
  this.view = view;
  /**
   * @type {string}
   */
  this.userHeadTag = '';
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
 * css class set to enable mobile version
 */
silex.model.Head.ENABLE_MOBILE_CSS_CLASS = 'enable-mobile';


/**
 * Update the settings from the DOM after a website was loaded
 */
silex.model.Head.prototype.updateFromDom = function() {
  this.setPublicationPath(this.getPublicationPath());
  this.setFaviconPath(this.getFaviconPath());
  this.setThumbnailSocialPath(this.getThumbnailSocialPath());
  this.setDescription(this.getDescription());
  this.setDescriptionSocial(this.getDescriptionSocial());
  this.setTitleSocial(this.getTitleSocial());
  this.setTitle(this.getTitle());
  this.setEnableMobile(this.getEnableMobile());
  this.setWebsiteWidth(this.getWebsiteWidth());
  // update text editor with the website custom styles and script
  this.model.head.setHeadStyle(this.model.head.getHeadStyle());
  this.model.head.setHeadScript(this.model.head.getHeadScript());
};


/**
 * set/get HEAD tag
 * the head tag edited by the user is a portion of the real head tag
 * it is delimited by specific comments
 * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
 * @return {string} the head tag content
 */
silex.model.Head.prototype.getUserHeadTag = function() {
  return this.userHeadTag;
};


/**
 * set/get HEAD tag
 * the head tag edited by the user is a portion of the real head tag
 * it is delimited by specific comments
 * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
 * @param {string} str
 */
silex.model.Head.prototype.setUserHeadTag = function(str) {
  this.userHeadTag = str;
};


/**
 * remove the user's head tag from the provided string and store it into this.userHeadTag
 * the head tag edited by the user is a portion of the real head tag
 * it is delimited by specific comments
 * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
 * @param {string} headString   initial head tag
 * @return {string} initial head tag without the user's head tag
 */
silex.model.Head.prototype.extractUserHeadTag = function(headString) {
  var regExp = new RegExp(silex.model.Head.HEAD_TAG_START + '([\\\s\\\S.]*)' + silex.model.Head.HEAD_TAG_STOP);
  var found = headString.match(regExp);
  if (found) {
    headString = headString.replace(regExp, '');
    this.userHeadTag = found[1];
  }
  else {
    this.userHeadTag = '';
  }
  return headString;
};


/**
 * insert the HEAD tag into an HTML string
 * the head tag edited by the user is a portion of the real head tag
 * it is delimited by specific comments
 * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
 * @param {string} htmlString
 * @return {string} the provided string with the user's head tags
 */
silex.model.Head.prototype.insertUserHeadTag = function(htmlString) {
  htmlString = htmlString.replace(/<\/head>/i, silex.model.Head.HEAD_TAG_START + this.userHeadTag + silex.model.Head.HEAD_TAG_STOP + '</head>');
  return htmlString;
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
  return window['css_beautify'](silexStyle.innerHTML);
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
 * @param {Object.<boolean>} neededFonts the embed fonts found in the website's body
 * @return {Array.<{href: string, name: string}>} font list
 */
silex.model.Head.prototype.refreshFontList = function(neededFonts) {
  var head = this.getHeadElement();
  //detach all previously loaded font before, to avoid duplicate
  var links = goog.dom.getElementsByClass(silex.model.Head.CUSTOM_FONTS_CSS_CLASS, head);
  goog.array.forEach(links, function(linkElement) {
    linkElement.parentNode.removeChild(linkElement);
  });

  //text styles can also be applied using old-school font tag.
  //Get face attribute values from them
  var fontTags = goog.dom.getElementsByTagNameAndClass('font', null, head);
  goog.array.forEach(fontTags, function(fontTag) {
    if (fontTag.getAttribute('face') !== null) {
      neededFonts[fontTag.getAttribute('face')] = true;
    }
  });

  //get authorised fonts
  var availableFonts = silex.Config.fonts;
  //return the font from the font family or null
  var getFont = function(fontFamily) {
    for (let fontName in availableFonts) {
      if (availableFonts[fontName].value === fontFamily) {
        return availableFonts[fontName];
      }
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
 * @return {?string}
 */
silex.model.Head.prototype.getMeta = function(name) {
  var metaNode = this.model.file.getContentDocument()
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
  // update the DOM element
  var metaNode = this.model.file.getContentDocument()
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
 * publication path is always absolute url
 * @param {?FileInfo=} opt_fileInfo
 */
silex.model.Head.prototype.setPublicationPath = function(opt_fileInfo) {
  // TODO: remove meta and store this value in the JSON like components params (see model/property.js)
  this.setMeta('publicationPath', opt_fileInfo == null ? null : JSON.stringify(opt_fileInfo));
  this.view.settingsDialog.setPublicationPath(opt_fileInfo);
};


/**
 * get/set the publication path
 * publication path is always absolute url
 * @return {?FileInfo}
 */
silex.model.Head.prototype.getPublicationPath = function() {
  var fileInfo = this.getMeta('publicationPath');
  try {
    return fileInfo == null ? null : /** @type {FileInfo} */ (JSON.parse(fileInfo));
  } catch(e) {
    // this happens with old publication path (just a string)
    return null;
  }
};


/**
 * enable/disable the mobile version
 * @param {boolean} enable
 */
silex.model.Head.prototype.setEnableMobile = function(enable) {
  let doc = this.model.file.getContentDocument();
  if(doc.body === null) {
    // body is null, this happens while undoing or redoing
    return;
  }
  let viewport = doc.querySelector('meta[data-silex-viewport]');
  if (enable === true) {
    doc.body.classList.add(silex.model.Head.ENABLE_MOBILE_CSS_CLASS);
    if (!viewport) {
      viewport = /** @type {HTMLMetaElement} */ (doc.createElement('meta'));
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=2.2';
      viewport.setAttribute('data-silex-viewport', '');
      doc.head.appendChild(viewport);
    }
  } else {
    doc.body.classList.remove(silex.model.Head.ENABLE_MOBILE_CSS_CLASS);
    if (viewport) {
      doc.head.removeChild(viewport);
    }
  }
  this.view.settingsDialog.setEnableMobile(enable);

  // redraw UI
  var pages = this.model.page.getPages();
  var page = this.model.page.getCurrentPage();
  this.view.propertyTool.redraw(this.model.body.getSelection(), pages, page);
};


/**
 * enable/disable the mobile version
 * @return {boolean}
 */
silex.model.Head.prototype.getEnableMobile = function() {
  const body = this.model.file.getContentDocument().body;
  if(body === null) {
    // body is null, this happens while undoing or redoing
    return false;
  }
  return body.classList.contains(silex.model.Head.ENABLE_MOBILE_CSS_CLASS);
};


/**
 * get/set the website width
 * @param {?string=} opt_value
 */
silex.model.Head.prototype.setWebsiteWidth = function(opt_value) {
  this.setMeta('website-width', opt_value);
  this.view.settingsDialog.setWebsiteWidth(opt_value);
  let silexStyle = this.getHeadElement().querySelector('.silex-style-settings');
  if(opt_value && opt_value !== '') {
    if (!silexStyle) {
      silexStyle = goog.dom.createElement('style');
      silexStyle.type = 'text/css';
      silexStyle.className = 'silex-style-settings';
      goog.dom.appendChild(this.getHeadElement(), silexStyle);
    }
    silexStyle.innerHTML = `
      .${silex.model.Element.WEBSITE_WIDTH_CLASS_NAME} {
        width: ${opt_value}px;
      }
    `;
  }
  else if(silexStyle) this.getHeadElement().removeChild(silexStyle);
};


/**
 * get/set the website width
 * @return {?string}
 */
silex.model.Head.prototype.getWebsiteWidth = function() {
  return this.getMeta('website-width');
};

/**
 * get/set the description
 * @param {?string=} opt_description
 */
silex.model.Head.prototype.setDescription = function(opt_description) {
  this.setMeta('description', opt_description);
  this.view.settingsDialog.setDescription(opt_description);
};


/**
 * get/set the description
 * @return {?string}
 */
silex.model.Head.prototype.getDescription = function() {
  return this.getMeta('description');
};


/**
 * website title
 * @return {?string}
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
 * @param {?string} name
 */
silex.model.Head.prototype.setTitle = function(name) {
  // find or create the title tag in the head section
  var titleNode = this.getHeadElement().querySelector('title');
  if (!titleNode) {
    titleNode = goog.dom.createElement('title');
    goog.dom.appendChild(this.getHeadElement(), titleNode);
  }
  // update website title
  titleNode.innerHTML = name || '';
  // update view
  this.view.settingsDialog.setTitle(name);
};


/**
 * website favicon
 * @return {?string}
 */
silex.model.Head.prototype.getFaviconPath = function() {
  var faviconTag = this.getHeadElement().querySelector('link[rel="shortcut icon"]');
  var url = null;
  if (faviconTag) {
    url = faviconTag.getAttribute('href');
  }
  return url;
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
  else if (!opt_path) {
    goog.dom.removeNode(faviconTag);
  }
  if (opt_path) {
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
};


/**
 * get/set the title for social networks
 * @return {?string}
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
};


/**
 * get/set the description for social networks
 * @return {?string}
 */
silex.model.Head.prototype.getDescriptionSocial = function() {
  return this.getMeta('twitter:description') || this.getMeta('og:description');
};


/**
 * get/set the thumbnail image for social networks
 * @param {?string=} opt_path
 */
silex.model.Head.prototype.setThumbnailSocialPath = function(opt_path) {
  this.setMeta('twitter:card', opt_path ? 'summary' : '');
  this.setMeta('twitter:image', opt_path);
  this.setMeta('og:image', opt_path);
  this.view.settingsDialog.setThumbnailSocialPath(opt_path);
};


/**
 * get/set the thumbnail image for social networks
 * @return {?string}
 */
silex.model.Head.prototype.getThumbnailSocialPath = function() {
  var url = this.getMeta('og:image') || this.getMeta('twitter:image');
  return url;
};


/**
 * get/set the twitter account
 * @param {?string=} opt_data
 */
silex.model.Head.prototype.setTwitterSocial = function(opt_data) {
  this.setMeta('twitter:card', opt_data ? 'summary' : '');
  this.setMeta('twitter:site', opt_data);
  this.view.settingsDialog.setTwitterSocial(opt_data);
};


/**
 * get/set the twitter account
 * @return {?string}
 */
silex.model.Head.prototype.getTwitterSocial = function() {
  return this.getMeta('twitter:site');
};


/**
 * @return  {Element}   head element of the loaded site
 */
silex.model.Head.prototype.getHeadElement = function() {
  // returns the head of the document in the iframe
  return this.model.file.getContentDocument().head;
};
