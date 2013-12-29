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
 *      created by silex.model.Element.createElement
 *
 */


goog.require('silex.model.ModelBase');
goog.provide('silex.model.Element');


/**
 * @constructor
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.model.Element = function(bodyElement, headElement) {
  // call super
  goog.base(this, bodyElement, headElement);
};

// inherit from silex.model.ModelBase
goog.inherits(silex.model.Element, silex.model.ModelBase);



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
 * in pageable plugin
silex.model.Element.LINK_ATTR = 'data-silex-href';


/**
 * constant for the class name of selected components
 * @const
 * @type {string}
 */
silex.model.Element.SELECTED_CLASS_NAME = 'silex-selected';


/**
 * constant for silex element type
 * @const
 * @type {string}
 */
silex.model.Element.LOADING_IMAGE = 'assets/image-loader.gif';


/**
 * get/set type of the element
 * @param  {element} element   created by silex, either a text box, image, ...
 * @return  {string}           the style of the element
 */
silex.model.Element.prototype.getType = function(element) {
  //return goog.style.getStyle(element, styleName);
  return element.getAttribute(silex.model.Element.TYPE_ATTR);
};


/**
 * get/set type of the element
 * @param  {element} element    created by silex, either a text box, image, ...
 * @param  {string}  type      the new type for this element
 */
silex.model.Element.prototype.setType = function(element, type) {
  console.error('Error: not implemented');
  throw('Error: not implemented');
  element.setAttribute(silex.model.Element.TYPE_ATTR, type);
};


/**
 * get/set style of the element
 * @param  {element} element   created by silex, either a text box, image, ...
 * @param  {string} styleName  the style name
 * @return  {string}           the style of the element
 */
silex.model.Element.prototype.getStyle = function(element, styleName) {
  //return goog.style.getStyle(element, styleName);
  return element.style[styleName];
};


/**
 * get/set style of element from a container created by silex
 * @param  {element} element            created by silex, either a text box, image, ...
 * @param  {string}  styleName          the style name, camel case, not css with dashes
 * @param  {string}  opt_styleValue     the value for this styleName
 */
silex.model.Element.prototype.setStyle = function(element, styleName, opt_styleValue) {
  if (opt_styleValue){
    element.style[styleName] = opt_styleValue;
  }
  else{
   element.style[styleName] = '';
  }
};


/**
 * User has selected an image
 * @param    {string} url    URL of the image chosen by the user
 */
silex.model.Element.prototype.setBgImage = function(element, url) {
  this.setStyle(element, 'backgroundImage', url);
};


/**
 * get/set html from a container created by silex
 * @param  {element} element  created by silex, either a text box, image, ...
 * @return  {string}  the html content
 */
silex.model.Element.prototype.getInnerHtml = function(element) {
  // disable editable
  silex.utils.JQueryEditable.setEditable(element, false);
  var innerHTML = this.getContentNode(element).innerHTML;
  // re-enable editable
  silex.utils.JQueryEditable.setEditable(element, true);
  return innerHTML;
};


/**
 * get/set element from a container created by silex
 * @param  {element} element  created by silex, either a text box, image, ...
 * @param  {string}  the html content
 */
silex.model.Element.prototype.setInnerHtml = function(element, innerHTML) {
  // disable editable
  silex.utils.JQueryEditable.setEditable(element, false);
  var contentNode = this.getContentNode(element);
  contentNode.innerHTML = innerHTML;
  // re-enable editable
  silex.utils.JQueryEditable.setEditable(element, true);
};

/**
 * get/set element from a container created by silex
 * @param  {element} element  created by silex, either a text box, image, ...
 * @return  {element}  the element which holds the content, i.e. a div, an image, ...
 */
silex.model.Element.prototype.getContentNode = function(element) {
  var content;
  // find the content elements
  var contentElements = goog.dom.getElementsByClass(silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
  if (contentElements && contentElements.length === 1){
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
 * @param  {element} element  created by silex, either a text box, image, ...
 * @param  {element} content  the element which holds the content, i.e. a div, an image, ...
 */
silex.model.Element.prototype.setContentNode = function(element, content) {
  // get the content to replace
  var initialContent = this.getContentNode(element);
  // replace in function of the element type
  if (initialContent === element) {
    // disable editable
    silex.utils.JQueryEditable.setEditable(element, false);
    // containers and text
    element.innerhtml = content.innerhtml;
    // re-enable editable
    silex.utils.JQueryEditable.setEditable(element, true);
  }
  else {
    // html and images
    goog.dom.replaceNode(content, initialContent);
  }
};

/**
 * set/get the image URL of an image element
 * @param  {element} element  container created by silex which contains an image
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
}
/**
 * set/get the image URL of an image element
 * @param  {element} element  container created by silex which contains an image
 * @param  {string} url  the url of the image
 * @param  {function}  the opt_callback to be notified when the image is loaded
 */
silex.model.Element.prototype.setImageUrl = function(element, url, opt_callback, opt_errorCallback) {
  if (element.getAttribute(silex.model.Element.TYPE_ATTR) === silex.model.Element.TYPE_IMAGE) {
    // get the image tag
    var img = this.getContentNode(element);
    if (img) {
      // listen to the complete event
      var imageLoader = new goog.net.ImageLoader();
      goog.events.listenOnce(imageLoader, goog.net.EventType.SUCCESS,
      function(e) {
        // update element size
        goog.style.setStyle(element, {
          width: e.target.naturalWidth,
          height: e.target.naturalHeight
        });
        // image tak all room available
        goog.style.setStyle(e.target, 'width', '100%');
        goog.style.setStyle(e.target, 'height', '100%');
        // replace the element current img tag
        element.setContentNode(e.target);
        // callback
        if (opt_callback){
          opt_callback(element);
        }
      });
      goog.events.listenOnce(imageLoader, goog.net.EventType.ERROR,
      function(e) {
        console.error('An error occured while loading the image.', element);
        // callback
        if(opt_errorCallback){
          opt_errorCallback(element, 'An error occured while loading the image.')
        }
      });
      // load the image
      imageLoader.addImage(url, url);
      imageLoader.start();
    }
    else {
      console.error('The image could not be retrieved from the element.', element);
      if(opt_errorCallback){
        opt_errorCallback(element, 'The image could not be retrieved from the element.')
      }
    }
  }
  else {
    console.error('The element is not an image.', element);
    if(opt_errorCallback){
      opt_errorCallback(element, 'The element is not an image.')
    }
  }
};


/**
 * remove a DOM element
 * @param  {element} element   the element to remove
 */
silex.model.Element.removeElement = function(element) {
  goog.dom.removeNode(element);
}

/**
 * element creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 * @param  {string} type  the type of the element to create,
 *	  see TYPE_* constants of the class @see silex.model.Element
 * @return 	{element} 	the newly created element
 */
silex.model.Element.createElement = function(type, opt_container) {

  var element;

  switch (type){

    // container
    case silex.model.Element.TYPE_CONTAINER:
      // create the conatiner
      element = goog.dom.createElement('div');
      element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_CONTAINER);
    break;

    // text
    case silex.model.Element.TYPE_TEXT:
      // create the element
      element = goog.dom.createElement('div');
      element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_TEXT);
      element.innerHTML = 'New text box';
    break;

    // HTML box
    case silex.model.Element.TYPE_HTML:
      // create the element
      element = goog.dom.createElement('div');
      element.className = silex.utils.JQueryEditable.EDITABLE_CLASS_NAME;
      element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_HTML);
      // create the container for html content
      var htmlContent = goog.dom.createElement('div');
      goog.dom.classes.add(htmlContent, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
      htmlContent.innerHTML = '<p>New HTML box</p>';
      goog.style.setStyle(htmlContent, 'width', '100%');
      goog.style.setStyle(htmlContent, 'height', '100%');
      goog.dom.appendChild(element, htmlContent);
    break;

    // Image
    case silex.model.Element.TYPE_IMAGE:
      // create the element
      element = goog.dom.createElement('div');
      element.className = silex.utils.JQueryEditable.EDITABLE_CLASS_NAME;
      element.setAttribute(silex.model.Element.TYPE_ATTR, silex.model.Element.TYPE_IMAGE);
      // create the container for the image element
      var img = goog.dom.createElement('img');
      goog.dom.classes.add(img, silex.model.Element.ELEMENT_CONTENT_CLASS_NAME);
      goog.style.setStyle(img, 'width', '100%');
      goog.style.setStyle(img, 'height', '100%');
      goog.dom.appendChild(element, img);
      // set default value
      img.setAttribute('src', silex.model.Element.LOADING_IMAGE);
    break;

  }

  // init the element
  goog.dom.classes.add(element, silex.utils.JQueryEditable.EDITABLE_CLASS_NAME);

  // make it editable
  silex.utils.JQueryEditable.setEditable(element, true);

  // set bounding box
  goog.style.setStyle(element, {
    height: '100px',
    width: '100px',
    backgroundColor: 'rgba(255, 255, 255, 1)'
  });
  // add to stage
  if(opt_container){
    goog.dom.appendChild(opt_container, element);
  }

  // return the element
  return element;
};


/**
 * get/set selection
 */
silex.model.Element.prototype.setSelected = function(element, isSelected) {
  if (isSelected) {
    // remove all others
    this.resetSelection();
    // set as selected
    goog.dom.classes.add(element, silex.model.Element.SELECTED_CLASS_NAME);
  }
  else {
    goog.dom.classes.remove(element, silex.model.Element.SELECTED_CLASS_NAME);
  }
};


/**
 * get/set selection
 */
silex.model.Element.prototype.getSelected = function(element) {
  return goog.dom.classes.has(element, silex.model.Element.SELECTED_CLASS_NAME);
};
