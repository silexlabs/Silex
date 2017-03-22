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
 *   This class is used to manage Silex elements
 *   It has methods to manipulate the DOM elements
 *      created by new silex.model.Element().createElement
 */

goog.provide('silex.model.Element');

goog.require('goog.net.EventType');
goog.require('goog.net.ImageLoader');
goog.require('silex.types.Model');


/**
 * direction in the dom
 * @enum {string}
 */
silex.model.DomDirection = {
  UP: 'UP',
  DOWN: 'DOWN',
  TOP: 'TOP',
  BOTTOM: 'BOTTOM'
};


/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Element = function(model, view) {
  // store the model and the view
  /**
   * @type {silex.types.Model}
   */
  this.model = model;
  /**
   * @type {silex.types.View}
   */
  this.view = view;
};


/**
 * constant for minimum elements size
 * @const
 * @type {number}
 */
silex.model.Element.MIN_HEIGHT = 20;


/**
 * constant for minimum elements size
 * @const
 * @type {number}
 */
silex.model.Element.MIN_WIDTH = 20;


/**
 * constant for loader on elements
 * @const
 * @type {string}
 */
silex.model.Element.LOADING_ELEMENT_CSS_CLASS = 'loading-image';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_CONTAINER = 'container';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_SECTION = 'section';


/**
 * constant for the content element of a section, which is also a container
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_CONTAINER_CONTENT = 'silex-container-content';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_IMAGE = 'image';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_TEXT = 'text';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_HTML = 'html';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.TYPE_ATTR = 'data-silex-type';


/**
 * constant for the class name of the element content
 * @const
 * @type {string}
 */
silex.model.Element.ELEMENT_CONTENT_CLASS_NAME = 'silex-element-content';


/**
 * constant for the class name of the default site width, rule is set when setting is changed
 * used to set a default width to section content container
 * @const
 * @type {string}
 */
silex.model.Element.WEBSITE_WIDTH_CLASS_NAME = 'website-width'


/**
 * constant for the class name of the default site width, rule is set when setting is changed
 * used to set a min-width to sections
 * @const
 * @type {string}
 */
silex.model.Element.WEBSITE_MIN_WIDTH_CLASS_NAME = 'website-min-width';


/**
 * constant for the attribute name of the links
 * @const
 * @type {string}
 */
silex.model.Element.LINK_ATTR = 'data-silex-href';


/**
 * constant for the class name of selected components
 * @const
 * @type {string}
 */
silex.model.Element.SELECTED_CLASS_NAME = 'silex-selected';


/**
 * constant for the class name of pasted components
 * this will be removed from the component as soon as it is dragged
 * @const
 * @type {string}
 */
silex.model.Element.JUST_ADDED_CLASS_NAME = 'silex-just-added';


/**
 * prepare element for edition
 * @param  {string} rawHtml   raw HTML of the element to prepare
 * @return {string} the processed HTML
 */
silex.model.Element.prototype.prepareHtmlForEdit = function(rawHtml) {
  // prevent the user scripts from executing while editing
  rawHtml = rawHtml.replace(/<script.*class=\"silex-script\".*?>/gi, '<script type="text/notjavascript" class="silex-script">');
  // convert to absolute urls
  let url = this.model.file.getUrl();
  if (url) {
    if(!silex.utils.Url.isAbsoluteUrl(url)) url = silex.utils.Url.getBaseUrl() + url;
    rawHtml = silex.utils.Url.relative2Absolute(rawHtml, url);
  }
  return rawHtml;
};



/**
 * unprepare element for edition
 * @param  {string} rawHtml   raw HTML of the element to prepare
 * @return {string} the processed HTML
 */
silex.model.Element.prototype.unprepareHtmlForEdit = function(rawHtml) {
  // put back the user script
  rawHtml = rawHtml.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
  // remove cache control used to refresh images after editing by pixlr
  rawHtml = silex.utils.Dom.removeCacheControl(rawHtml);
  if (this.model.file.getUrl()) {
    // convert to relative urls
    let baseUrl = silex.utils.Url.getBaseUrl();
    rawHtml = silex.utils.Url.absolute2Relative(rawHtml, baseUrl + this.model.file.getUrl());
    // put back the static scripts (protocol agnostic)
    let staticUrl = baseUrl.substr(baseUrl.indexOf('//')) + 'static/';
    rawHtml = rawHtml.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/[\.\.\/]*static\//g, staticUrl);
  }
  return rawHtml;
};


/**
 * get num tabs
 * example: getTabs(2) returns '        '
 * @param {number} num
 * @return {string}
 */
silex.model.Element.prototype.getTabs = function(num) {
  var tabs = '';
  for (var n = 0; n < num; n++) {
    tabs += '    ';
  }
  return tabs;
};


/**
 * get/set type of the element
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @return  {?string}           the style of the element
 * example: for a container this will return "container"
 */
silex.model.Element.prototype.getType = function(element) {
  return element.getAttribute(silex.model.Element.TYPE_ATTR);
};


/**
 * @param  {Element} element   created by silex
 * @return true if el is a section or the content container of a section
 */
silex.model.Element.prototype.isSection = function(element) {
  return element.classList.contains(silex.model.Element.TYPE_SECTION + '-element');
}


/**
 * @param  {Element} element   created by silex
 * @return true if el is a section or the content container of a section
 */
silex.model.Element.prototype.isSectionContent = function(element) {
  return element.classList.contains(silex.model.Element.TYPE_CONTAINER_CONTENT);
}


/**
 * get all the element's styles
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @param {?boolean=} opt_computed use window.getComputedStyle instead of the element's stylesheet
 * @return  {string}           the styles of the element
 */
silex.model.Element.prototype.getAllStyles = function(element, opt_computed) {
  var styleObject = this.model.property.getStyle(element, null, opt_computed);
  var styleStr = silex.utils.Style.styleToString(styleObject);
  return this.unprepareHtmlForEdit(styleStr);
};


/**
 * get/set style of the element
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @param  {string} styleName  the style name
 * @param {?boolean=} opt_computed use window.getComputedStyle instead of the element's stylesheet
 * @return  {?string}           the style of the element
 */
silex.model.Element.prototype.getStyle = function(element, styleName, opt_computed) {
  const cssName = goog.string.toSelectorCase(styleName);
  const isMobile = this.view.workspace.getMobileEditor();
  let styleObject = this.model.property.getStyle(element, isMobile, opt_computed);
  if (styleObject && styleObject[cssName]) {
    return this.unprepareHtmlForEdit(styleObject[cssName]);
  }
  else if (isMobile) {
    // get the non mobile style if it is not defined in mobile
    styleObject = this.model.property.getStyle(element, false, opt_computed);
    if (styleObject && styleObject[cssName]) {
      return this.unprepareHtmlForEdit(styleObject[cssName]);
    }
  }
  return null;
};


/**
 * get/set style of element from a container created by silex
 * @param  {Element} element            created by silex, either a text box, image, ...
 * @param  {string}  styleName          the style name, camel case, not css with dashes
 * @param  {?string=}  opt_styleValue     the value for this styleName
 * @param  {?boolean=}  opt_preserveJustAdded     if true, do not remove the "just added" css class, default is false
 */
silex.model.Element.prototype.setStyle = function(element, styleName, opt_styleValue, opt_preserveJustAdded) {
  // convert to css case
  styleName = goog.string.toSelectorCase(styleName);
  // remove the 'just pasted' class
  if(!opt_preserveJustAdded) element.classList.remove(silex.model.Element.JUST_ADDED_CLASS_NAME);
  // retrieve style
  var styleObject = this.model.property.getStyle(element);
  if (!styleObject) {
    styleObject = {};
  }
  // apply the new style
  if (styleObject[styleName] !== opt_styleValue) {
    if (goog.isDefAndNotNull(opt_styleValue)) {
      styleObject[styleName] = this.prepareHtmlForEdit(opt_styleValue);
    }
    else {
      styleObject[styleName] = '';
    }
    this.model.property.setStyle(element, styleObject);
  }
};


/**
 * get/set a property of an element from a container created by silex
 * @param  {Element} element            created by silex, either a text box, image, ...
 * @param  {string}  propertyName          the property name
 * @param  {?string=}  opt_propertyValue     the value for this propertyName
 * @param  {?boolean=}  opt_applyToContent    apply to the element or to its ".silex-element-content" element
 * example: element.setProperty(imgElement, 'style', 'top: 5px; left: 30px;')
 */
silex.model.Element.prototype.setProperty = function(element, propertyName, opt_propertyValue, opt_applyToContent) {
  if (opt_applyToContent) {
    element = this.getContentNode(element);
  }
  if (goog.isDefAndNotNull(opt_propertyValue)) {
    element.setAttribute(propertyName, /** @type {!string} */ (opt_propertyValue));
  }
  else {
    element.removeAttribute(propertyName);
  }
};


/**
 * @param {Element} element
 * @param {string} url    URL of the image chosen by the user
 */
silex.model.Element.prototype.setBgImage = function(element, url) {
  if (url) {
    this.setStyle(element, 'backgroundImage', silex.utils.Url.addUrlKeyword(url));
  }
  else {
    this.setStyle(element, 'backgroundImage');
  }
  // redraw tools
  this.model.body.setSelection(this.model.body.getSelection());
};


/**
 * get/set html from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @return  {string}  the html content
 */
silex.model.Element.prototype.getInnerHtml = function(element) {
  // disable editable
  this.model.body.setEditable(element, false);
  var innerHTML = this.getContentNode(element).innerHTML;
  // remove absolute urls and not executable scripts
  innerHTML = this.unprepareHtmlForEdit(innerHTML);
  // re-enable editable
  this.model.body.setEditable(element, true);
  return innerHTML;
};


/**
 * get/set element from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @param  {string} innerHTML the html content
 */
silex.model.Element.prototype.setInnerHtml = function(element, innerHTML) {
  // get the container of the html content of the element
  var contentNode = this.getContentNode(element);
  // cleanup
  this.model.body.setEditable(element, false);
  // remove absolute urls and not executable scripts
  innerHTML = this.prepareHtmlForEdit(innerHTML);
  // set html
  contentNode.innerHTML = innerHTML;
  // make editable again
  this.model.body.setEditable(element, true);
};


/**
 * get/set element from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @return  {Element}  the element which holds the content, i.e. a div, an image, ...
 */
silex.model.Element.prototype.getContentNode = function(element) {
  return element.querySelector(
    ':scope > .' + silex.model.Element.ELEMENT_CONTENT_CLASS_NAME) ||
    element;
};


/**
 * move the element up/down the DOM
 * @param  {Element} element
 * @param  {silex.model.DomDirection} direction
 */
silex.model.Element.prototype.move = function(element, direction) {
  // do not move a section's container content, but the section itself
  if(this.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  switch (direction) {
    case silex.model.DomDirection.UP:
      let sibling = this.getNextElement(element);
      if (sibling) {
        // insert after
        element.parentNode.insertBefore(sibling, element);
      }
      break;
    case silex.model.DomDirection.DOWN:
      let sibling = this.getPreviousElement(element);
      if (sibling) {
        // insert before
        element.parentNode.insertBefore(sibling, element.nextSibling);
      }
      break;
    case silex.model.DomDirection.TOP:
      element.parentNode.appendChild(element);
      break;
    case silex.model.DomDirection.BOTTOM:
      element.parentNode.insertBefore(element, element.parentNode.childNodes[0]);
      break;
  }
  // remove the 'just pasted' class
  element.classList.remove(silex.model.Element.JUST_ADDED_CLASS_NAME);
};


/**
 * get the previous element in the DOM, which is a Silex element
 * @param {Element} element
 * @return {?Element}
 */
silex.model.Element.prototype.getPreviousElement = function(element) {
  let len = element.parentNode.childNodes.length;
  let res = null;
  for (let idx = 0; idx < len; idx++) {
    let el = element.parentNode.childNodes[idx];
    if (el.nodeType === 1 && this.getType(el) !== null) {
      if (el === element) {
        return res;
      }
      // candidates are the elements which are visible in the current page, or visible everywhere (not paged)
      if (this.model.page.isInPage(el) || this.model.page.getPagesForElement(el).length === 0) {
        res = el;
      }
    }
  }
  return null;
};


/**
 * get the previous element in the DOM, which is a Silex element
 * @param {Element} element
 * @return {?Element}
 */
silex.model.Element.prototype.getNextElement = function(element) {
  let len = element.parentNode.childNodes.length;
  let res = null;
  for (let idx = len - 1; idx >= 0; idx--) {
    let el = element.parentNode.childNodes[idx];
    if (el.nodeType === 1 && this.getType(el) !== null) {
      if (el === element) {
        return res;
      }
      // candidates are the elements which are visible in the current page, or visible everywhere (not paged)
      if (this.model.page.isInPage(el) || this.model.page.getPagesForElement(el).length === 0) {
        res = el;
      }
    }
  }
  return null;
};


/**
 * set/get the image URL of an image element
 * @param  {Element} element  container created by silex which contains an image
 * @return  {string}  the url of the image
 */
silex.model.Element.prototype.getImageUrl = function(element) {
  var url = '';
  if (element.getAttribute(silex.model.Element.TYPE_ATTR) === silex.model.Element.TYPE_IMAGE) {
    // get the image tag
    let img = this.getContentNode(element);
    if (img) {
      url = img.getAttribute('src');
    }
    else {
      console.error('The image could not be retrieved from the element.', element);
    }
  }
  else {
    console.error('The element is not an image.', element);
  }
  return url;
};


/**
 * set/get the image URL of an image element
 * @param  {Element} element  container created by silex which contains an image
 * @param  {string} url  the url of the image
 * @param  {?function(Element, Element)=} opt_callback the callback to be notified when the image is loaded
 * @param  {?function(Element, string)=} opt_errorCallback the callback to be notified of errors
 */
silex.model.Element.prototype.setImageUrl = function(element, url, opt_callback, opt_errorCallback) {
  if (element.getAttribute(silex.model.Element.TYPE_ATTR) === silex.model.Element.TYPE_IMAGE) {
    // get the image tag
    let img = this.getContentNode(element);
    if (img) {
      //img.innerHTML = '';
      // listen to the complete event
      var imageLoader = new goog.net.ImageLoader();
      goog.events.listenOnce(imageLoader, goog.events.EventType.LOAD,
          function(e) {
            // handle the loaded image
            img = e.target;
            // update element size
            this.setStyle(element, 'width', Math.max(silex.model.Element.MIN_WIDTH, img.naturalWidth) + 'px', true);
            this.setStyle(element, this.getHeightStyleName(element), Math.max(silex.model.Element.MIN_HEIGHT, img.naturalHeight) + 'px', true);
            // callback
            if (opt_callback) {
              opt_callback(element, img);
            }
            // add the image to the element
            goog.dom.appendChild(element, img);
            // add a marker to find the inner content afterwards, with getContent
            goog.dom.classlist.add(img, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
            // remove the id set by the loader (it needs it to know what has already been loaded?)
            img.removeAttribute('id');
            // remove loading asset
            goog.dom.classlist.remove(element, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
            // redraw tools
            this.model.body.setSelection(this.model.body.getSelection());
          }, true, this);
      goog.events.listenOnce(imageLoader, goog.net.EventType.ERROR,
          function() {
            console.error('An error occured while loading the image.', element);
            // callback
            if (opt_errorCallback) {
              opt_errorCallback(element, 'An error occured while loading the image.');
            }
          }, true, this);
      // add loading asset
      goog.dom.classlist.add(element, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
      // remove previous img tag
      var imgTags = goog.dom.getElementsByTagNameAndClass('img', silex.model.Element.ELEMENT_CONTENT_CLASS_NAME, element);
      if (imgTags.length > 0) {
        goog.dom.removeNode(imgTags[0]);
      }
      // load the image
      imageLoader.addImage(url, url);
      imageLoader.start();
    }
    else {
      console.error('The image could not be retrieved from the element.', element);
      if (opt_errorCallback) {
        opt_errorCallback(element, 'The image could not be retrieved from the element.');
      }
    }
  }
  else {
    console.error('The element is not an image.', element);
    if (opt_errorCallback) {
      opt_errorCallback(element, 'The element is not an image.');
    }
  }
};


/**
 * remove a DOM element
 * @param  {Element} element   the element to remove
 */
silex.model.Element.prototype.removeElement = function(element) {
  // never delete sections container content, but the section itself
  if(this.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  // check this is allowed, i.e. an element inside the stage container
  if (this.model.body.getBodyElement() !== element &&
      goog.dom.contains(this.model.body.getBodyElement(), element)) {
    // remove style and component data
    this.model.property.setComponentData(element);
    this.model.property.setStyle(element, null, true);
    this.model.property.setStyle(element, null, false);
    // remove the element
    goog.dom.removeNode(element);
  }
  else {
    console.error('could not delete', element, 'because it is not in the stage element');
  }
};


/**
 * append an element to the stage
 * handles undo/redo
 * @param {Element} container
 * @param {Element} element
 */
silex.model.Element.prototype.addElement = function(container, element) {
  // for sections, force body
  if(this.isSection(element)) {
    container = this.model.body.getBodyElement();
  }
  goog.dom.appendChild(container, element);
  // add the class to keep the element above all others
  element.classList.add(silex.model.Element.JUST_ADDED_CLASS_NAME);
};

silex.model.Element.INITIAL_ELEMENT_SIZE = 100;


/**
 * add an element at the center of the stage
 * and move it into the container beneeth it
 * @param {Element} element    the element to add
 * @param {?number=} opt_offset an offset to apply to its position (x and y)
 */
silex.model.Element.prototype.addElementDefaultPosition = function(element, opt_offset) {
  opt_offset = opt_offset || 0;
  // find the container (main background container or the stage)
  const stageSize = this.view.stage.getStageSize();
  const bb = this.model.property.getBoundingBox([element]);
  const posX = Math.round((stageSize.width / 2) - (bb.width / 2));
  const posY = 100;
  const container = this.getBestContainerForNewElement(posX, posY);
  // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
  const bbContainer = goog.style.getBounds(container);
  const offsetX = posX + this.view.stage.getScrollX() - bbContainer.left;
  const offsetY = posY + this.view.stage.getScrollY() - bbContainer.top;
  // add to stage
  this.addElement(container, element);
  // apply the style (force desktop style, not mobile)
  const styleObject = this.model.property.getStyle(element, false);
  styleObject.top = (opt_offset + offsetY) + 'px';
  styleObject.left = (opt_offset + offsetX) + 'px';
  this.model.property.setStyle(element, styleObject, false);
};


/**
 * find the best drop zone at a given position
 * NEW: drop in the body directly since containers have their own z-index
 *      and the element is partly hidden sometimes if we drop it in a container
 * @param  {number} x position in px
 * @param  {number} y position in px
 * @return {Element} the container element under (x, y)
 */
silex.model.Element.prototype.getBestContainerForNewElement = function(x, y) {
  // let dropZone = this.view.stage.getDropZone(x, y) || {'element': this.model.body.getBodyElement(), 'zIndex': 0};
  // return dropZone.element;
  return this.model.body.getBodyElement();
};


/**
 * init the element depending on its type
 * @param {Element} element
 */
silex.model.Element.prototype.initElement = function(element) {
  // default style
  var defaultStyleObject = {};
  defaultStyleObject['width'] = silex.model.Element.INITIAL_ELEMENT_SIZE + 'px';
  defaultStyleObject[this.getHeightStyleName(element)] = silex.model.Element.INITIAL_ELEMENT_SIZE + 'px';

  // init the element depending on its type
  switch(this.getType(element)) {
    case silex.model.Element.TYPE_CONTAINER:
    case silex.model.Element.TYPE_HTML:
      defaultStyleObject['background-color'] = 'rgb(255, 255, 255)';
      break;

    case silex.model.Element.TYPE_SECTION:
      this.view.stage.setScrollTarget(element);
      break;

    case silex.model.Element.TYPE_TEXT:
    case silex.model.Element.TYPE_IMAGE:
      break;
  }

  // default style to the element style
  // keep the style if there is one, usually set by component::initComponent
  const finalStyleObject = this.model.property.getStyle(element, false) || {};
  for(var name in defaultStyleObject) finalStyleObject[name] = finalStyleObject[name] || defaultStyleObject[name];

  // apply the style (force desktop style, not mobile)
  this.model.property.setStyle(element, finalStyleObject, false);

  // position on stage
  this.addElementDefaultPosition(element);
};


/**
 * element creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 * @param  {string} type  the type of the element to create,
 *    see TYPE_* constants of the class @see silex.model.Element
 * @return  {Element}   the newly created element
 */
silex.model.Element.prototype.createElement = function(type) {
  // create the element
  var element = null;
  switch (type) {
    // container
    case silex.model.Element.TYPE_CONTAINER:
      element = this.createContainerElement();
      break;

    // section
    case silex.model.Element.TYPE_SECTION:
      element = this.createSectionElement();
      break;

    // text
    case silex.model.Element.TYPE_TEXT:
      element = this.createTextElement();
      break;

    // HTML box
    case silex.model.Element.TYPE_HTML:
      element = this.createHtmlElement();
      break;

    // Image
    case silex.model.Element.TYPE_IMAGE:
      element = this.createImageElement();
      break;

  }

  // init the element
  goog.dom.classlist.add(element, silex.model.Body.EDITABLE_CLASS_NAME);
  this.model.property.initSilexId(element, this.model.file.getContentDocument());

  // make it editable
  this.model.body.setEditable(element, true);

  // add css class for Silex styles
  goog.dom.classlist.add(element, type + '-element');

  // return the element
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createContainerElement = function() {
  // create the conatiner
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_CONTAINER);
  return element;
};


/**
 * @param {string} className
 * @return {Element}
 */
silex.model.Element.prototype.createElementWithContent = function(className) {
  // create the element
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, className);
  // create the container for text content
  var content = goog.dom.createElement('div');
  // add empty content
  goog.dom.appendChild(element, content);
  // add a marker to find the inner content afterwards, with getContent
  goog.dom.classlist.add(content, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
  // done
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createSectionElement = function() {
  // create the element
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_CONTAINER);
  element.classList.add(silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME);
  element.classList.add(silex.model.Element.TYPE_CONTAINER + '-element');
  element.classList.add(silex.model.Element.WEBSITE_MIN_WIDTH_CLASS_NAME);
  // content element is both a container and a content element
  var content = this.createContainerElement();
  var styleObject = {
    'min-height': '100px',
    'background-color': 'rgb(255, 255, 255)'
  };
  content.classList.add(silex.model.Body.EDITABLE_CLASS_NAME);
  content.classList.add(silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
  content.classList.add(silex.model.Element.WEBSITE_WIDTH_CLASS_NAME);
  this.model.property.initSilexId(content, this.model.file.getContentDocument());
  this.model.property.setStyle(content, styleObject, false);
  content.classList.add(silex.model.Element.TYPE_CONTAINER_CONTENT);
  content.classList.add(silex.model.Element.TYPE_CONTAINER + '-element');
  content.classList.add(silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME);
  element.appendChild(content);
  // done
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createTextElement = function() {
  // create the element
  var element = this.createElementWithContent(silex.model.Element.TYPE_TEXT);
  // add default content
  var content = this.getContentNode(element);
  content.innerHTML = 'New text box';
  // add normal class for default text formatting
  // sometimes there is only in text node in content
  // e.g. whe select all + remove formatting
  goog.dom.classlist.add(content, 'normal');
  // done
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createHtmlElement = function() {
  // create the element
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_HTML);
  // create the container for html content
  var htmlContent = goog.dom.createElement('div');
  htmlContent.innerHTML = '<p>New HTML box</p>';
  goog.dom.appendChild(element, htmlContent);
  // add a marker to find the inner content afterwards, with getContent
  goog.dom.classlist.add(htmlContent, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);

  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 * @return {Element}
 */
silex.model.Element.prototype.createImageElement = function() {
  // create the element
  var element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_IMAGE);
  return element;
};


/**
 * set/get a "silex style link" on an element
 * @param  {Element} element
 * @param  {?string=} opt_link  a link (absolute or relative)
 *         or an internal link (beginning with #!)
 *         or null to remove the link
 */
silex.model.Element.prototype.setLink = function(element, opt_link) {
  if (opt_link) {
    element.setAttribute(silex.model.Element.LINK_ATTR, opt_link);
  }
  else {
    element.removeAttribute(silex.model.Element.LINK_ATTR);
  }
};


/**
 * set/get a "silex style link" on an element
 * @param  {Element} element
 * @return {string}
 */
silex.model.Element.prototype.getLink = function(element) {
  return element.getAttribute(silex.model.Element.LINK_ATTR);
};


/**
 * get/set class name of the element of a container created by silex
 * remove all silex internal classes
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @return  {?string}           the value for this styleName
 */
silex.model.Element.prototype.getClassName = function(element) {
  var pages = this.model.page.getPages();
  return element.className.split(' ').filter((name) => {
    if (name === '' ||
        goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name) ||
        goog.array.contains(pages, name) ||
        this.model.property.getSilexId(element) === name) {
      return false;
    }
    return true;
  }).join(' ');
};


/**
 * get/set class name of the element of a container created by silex
 * remove all silex internal classes
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @param  {string=} opt_className  the class names, or null to reset
 */
silex.model.Element.prototype.setClassName = function(element, opt_className) {
  // compute class names to keep, no matter what
  // i.e. the one which are in element.className + in Silex internal classes
  var pages = this.model.page.getPages();
  var classNamesToKeep = goog.array.map(element.className.split(' '), function(name) {
    if (goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name) ||
        goog.array.contains(pages, name) ||
        this.model.property.getSilexId(element) === name) {
      return name;
    }
  }, this);

  // reset element class name
  element.className = classNamesToKeep.join(' ');
  if (opt_className) {
    // apply classes from opt_className
    goog.array.forEach(opt_className.split(' '), function(name) {
      name = name.trim();
      if (name && name !== '') {
        goog.dom.classlist.add(element, name);
      }
    });
  }
};


/**
 * get the name of the style to be used to set the height of the element
 * returns 'height' or 'minHeight' depending on the element type
 * @param {Element} element
 * @return {string} 'height' or 'minHeight' depending on the element type
 */
silex.model.Element.prototype.getHeightStyleName = function(element) {
  if(element.classList.contains(silex.model.Body.SILEX_USE_HEIGHT_NOT_MINHEIGHT)) {
    return 'height';
  }
  return 'minHeight';
};
