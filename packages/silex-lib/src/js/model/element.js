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
 *   This class is used to manage Silex elements
 *   It has methods to manipulate the DOM elements
 *      created by new silex.model.Element().createElement
 *
 *   All model classes are singletons
 */

goog.provide('silex.model.Element');

goog.require('goog.dom.classes');
goog.require('goog.net.EventType');
goog.require('goog.net.ImageLoader');
goog.require('silex.types.Model');



/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Element = function(model, view) {
  this.view = view;
  this.model = model;
  // retrieve the element which will hold the body of the opened file
  this.iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
};


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
 * get/set type of the element
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @return  {string}           the style of the element
 */
silex.model.Element.prototype.getType = function(element) {
  //return goog.style.getStyle(element, styleName);
  return element.getAttribute(silex.model.Element.TYPE_ATTR);
};


/**
 * get/set style of the element
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @param  {string} styleName  the style name
 * @return  {string}           the style of the element
 */
silex.model.Element.prototype.getStyle = function(element, styleName) {
  //return goog.style.getStyle(element, styleName);
  return element.style[styleName];
};


/**
 * get/set style of element from a container created by silex
 * @param  {Element} element            created by silex, either a text box, image, ...
 * @param  {string}  styleName          the style name, camel case, not css with dashes
 * @param  {string=}  opt_styleValue     the value for this styleName
 */
silex.model.Element.prototype.setStyle = function(element, styleName, opt_styleValue) {
  if (element.style[styleName] !== opt_styleValue) {
    if (goog.isDef(opt_styleValue)) {
      element.style[styleName] = opt_styleValue;
    }
    else {
      element.style[styleName] = '';
    }
    // update the view
    var pages = this.model.page.getPages();
    var page = this.model.page.getCurrentPage();
    var selectedElements = this.model.body.getSelection();
    this.view.propertyTool.redraw(selectedElements, goog.dom.getFrameContentDocument(this.iframeElement), pages, page);
    this.view.stage.redraw(selectedElements, goog.dom.getFrameContentDocument(this.iframeElement), pages, page);
  }
};


/**
 * get/set a property of an element from a container created by silex
 * @param  {Element} element            created by silex, either a text box, image, ...
 * @param  {string}  propertyName          the property name
 * @param  {string=}  opt_propertyValue     the value for this propertyName
 * @example element.setProperty(imgElement, 'style', 'top: 5px; left: 30px;')
 */
silex.model.Element.prototype.setProperty = function(element, propertyName, opt_propertyValue, opt_applyToContent) {
  if (opt_applyToContent) element = this.getContentNode(element);
  if (goog.isDef(opt_propertyValue)) {
    element.setAttribute(propertyName, opt_propertyValue);
  }
  else {
    element.removeAttribute(propertyName);
  }
};


/**
 * @param    {string} url    URL of the image chosen by the user
 */
silex.model.Element.prototype.setBgImage = function(element, url) {
  if (url) {
    this.setStyle(element, 'backgroundImage', 'url(' + url + ')');
  }
  else {
    this.setStyle(element, 'backgroundImage');
  }
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
  // re-enable editable
  this.model.body.setEditable(element, true);
  return innerHTML;
};


/**
 * get/set element from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @param  {string}  the html content
 */
silex.model.Element.prototype.setInnerHtml = function(element, innerHTML) {
  // get the container of the html content of the element
  var contentNode = this.getContentNode(element);
  // cleanup
  this.model.body.setEditable(element, false);
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
  var content;
  // find the content elements
  var contentElements = goog.dom.getElementsByClass(
      silex.model.Element.ELEMENT_CONTENT_CLASS_NAME,
      element);
  if (contentElements && contentElements.length === 1) {
    // image or html box case
    content = contentElements[0];
  }
  else {
    // text box or container case
    content = element;
  }
  return content;
};


/**
 * get/set element from a container created by silex
 * @param  {Element} element  created by silex, either a text box, image, ...
 * @param  {Element} content  the element which holds the content, i.e. a div, an image, ...
 */
silex.model.Element.prototype.setContentNode = function(element, content) {
  // get the content to replace
  var initialContent = this.getContentNode(element);
  // replace in function of the element type
  if (initialContent === element) {
    // disable editable
    this.model.body.setEditable(element, false);
    // containers and text
    element.innerhtml = content.innerhtml;
    // re-enable editable
    this.model.body.setEditable(element, true);
  }
  else {
    // html and images
    goog.dom.replaceNode(content, initialContent);
  }
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
    var img = this.getContentNode(element);
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
 * @param  {function}  the opt_callback to be notified when the image is loaded
 */
silex.model.Element.prototype.setImageUrl = function(element, url, opt_callback, opt_errorCallback) {
  if (element.getAttribute(silex.model.Element.TYPE_ATTR) === silex.model.Element.TYPE_IMAGE) {
    // get the image tag
    var img = this.getContentNode(element);
    if (img) {
      //img.innerHTML = '';
      // listen to the complete event
      var imageLoader = new goog.net.ImageLoader();
      goog.events.listenOnce(imageLoader, goog.events.EventType.LOAD,
          function(e) {
            // handle the loaded image
            var img = e.target;
            // callback
            if (opt_callback) {
              opt_callback(element, img);
            }
            // add the image to the element
            goog.dom.appendChild(element, img);
            // image tak all room available !! has to be after the callback because img.naturalWidth is used
            goog.style.setStyle(img, 'width', '100%');
            goog.style.setStyle(img, 'height', '100%');
            // add a marker to find the inner content afterwards, with getContent
            goog.dom.classes.add(img, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
            // remove the id set by the loader (it needs it to know what has already been loaded?)
            img.removeAttribute('id');
            // remove loading asset
            goog.dom.classes.remove(element, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
          }, true, this);
      goog.events.listenOnce(imageLoader, goog.net.EventType.ERROR,
          function(e) {
            console.error('An error occured while loading the image.', element);
            // callback
            if (opt_errorCallback) {
              opt_errorCallback(element, 'An error occured while loading the image.');
            }
          }, true, this);
      // add loading asset
      goog.dom.classes.add(element, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
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
  // check this is allowed, i.e. an element inside the stage container
  if (this.model.body.getBodyElement() != element
    && goog.dom.contains(this.model.body.getBodyElement(), element)) {
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
 */
silex.model.Element.prototype.addElement = function(container, element) {
  goog.dom.appendChild(container, element);
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

  var element;
  var bodyElement = this.model.body.getBodyElement();

  // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
  var offsetX = 100 + this.view.stage.getScrollX();
  var offsetY = 100 + this.view.stage.getScrollY();

  // default style
  var styleObject = {
    height: '100px',
    width: '100px',
    top: offsetY + 'px',
    left: offsetX + 'px',
    position: 'absolute'
  };

  switch (type) {

    // container
    case silex.model.Element.TYPE_CONTAINER:
      element = this.createContainerElement(styleObject);
      break;

    // text
    case silex.model.Element.TYPE_TEXT:
      element = this.createTextElement(styleObject);
      break;

    // HTML box
    case silex.model.Element.TYPE_HTML:
      element = this.createHtmlElement(styleObject);
      break;

    // Image
    case silex.model.Element.TYPE_IMAGE:
      element = this.createImageElement(styleObject);
      break;

  }

  // init the element
  element.className = silex.model.Body.EDITABLE_CLASS_NAME;
  goog.dom.classes.add(element, silex.model.Body.EDITABLE_CLASS_NAME);

  // make it editable
  this.model.body.setEditable(element, true);

  // find the container (main background container or the stage)
  var container = goog.dom.getElementByClass(silex.view.Stage.BACKGROUND_CLASS_NAME, bodyElement);
  if (!container) {
    container = bodyElement;
  }
  // add css class for Silex styles
  goog.dom.classes.add(element, type + '-element');
  // add to stage
  this.addElement(container, element);
  // return the element
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 */
silex.model.Element.prototype.createContainerElement = function(styleObject) {
  // create the conatiner
  element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_CONTAINER);
  // add a default style
  styleObject.backgroundColor = '#FFFFFF';
  goog.style.setStyle(element, styleObject);
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 */
silex.model.Element.prototype.createTextElement = function(styleObject) {
  // create the element
  element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_TEXT);
  // create the container for text content
  var textContent = goog.dom.createElement('div');
  // add empty content
  textContent.innerHTML = 'New text box';
  goog.style.setStyle(textContent, 'width', '100%');
  goog.style.setStyle(textContent, 'height', '100%');
  goog.dom.appendChild(element, textContent);
  // add a marker to find the inner content afterwards, with getContent
  goog.dom.classes.add(textContent, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
  // add normal class for default text formatting
  // sometimes there is only in text node in textContent
  // e.g. whe select all + remove formatting
  goog.dom.classes.add(textContent, 'normal');
  goog.style.setStyle(element, styleObject);
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 */
silex.model.Element.prototype.createHtmlElement = function(styleObject) {
  // create the element
  element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_HTML);
  // create the container for html content
  var htmlContent = goog.dom.createElement('div');
  htmlContent.innerHTML = '<p>New HTML box</p>';
  goog.style.setStyle(htmlContent, 'width', '100%');
  goog.style.setStyle(htmlContent, 'height', '100%');
  goog.dom.appendChild(element, htmlContent);
  // add a marker to find the inner content afterwards, with getContent
  goog.dom.classes.add(htmlContent, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
  // add a default style
  styleObject.backgroundColor = '#FFFFFF';
  goog.style.setStyle(element, styleObject);
  return element;
};


/**
 * element creation method for a given type
 * called from createElement
 */
silex.model.Element.prototype.createImageElement = function(styleObject) {
  // create the element
  element = goog.dom.createElement('div');
  element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_IMAGE);
  goog.style.setStyle(element, styleObject);
  return element;
};


/**
 * set/get a "silex style link" on an element
 * @param  {string} link  a link (absolute or relative)
 *         or an internal link (beginning with #!)
 *         or null to remove the link
 */
silex.model.Element.prototype.setLink = function(element, link) {
  if (link) {
    element.setAttribute(silex.model.Element.LINK_ATTR, link);
  }
  else {
    element.removeAttribute(silex.model.Element.LINK_ATTR);
  }
};


/**
 * set/get a "silex style link" on an element
 */
silex.model.Element.prototype.getLink = function(element) {
  var link = element.getAttribute(silex.model.Element.LINK_ATTR);
  return link;
};


/**
 * get/set class name of the element of a container created by silex
 * remove all silex internal classes
 * @param  {Element} element   created by silex, either a text box, image, ...
 * @return  {string}           the value for this styleName
 */
silex.model.Element.prototype.getClassName = function(element) {
  var pages = this.model.page.getPages();
  return goog.array.map(element.className.split(' '), function(name) {
    if (goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name)
      || goog.array.contains(pages, name)) {
      return;
    }
    return name;
  }).join(' ').trim();
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
    if (goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name)
      || goog.array.contains(pages, name)) {
      return name;
    }
    return;
  });

  // reset element class name
  element.className = classNamesToKeep.join(' ');
  if (opt_className) {
    // apply classes from opt_className
    goog.array.forEach(opt_className.split(' '), function(name) {
      name = name.trim();
      if (name && name !== '') {
        goog.dom.classes.add(element, name);
      }
    });
  }
};
