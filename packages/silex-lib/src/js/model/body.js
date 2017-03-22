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
 *   This class represents a the body of the opened file,
 *   which is rendered by the Stage class
 *   It has methods to manipulate the dom
 */


goog.provide('silex.model.Body');
goog.require('silex.Config');
goog.require('silex.types.Model');



/**
 * @constructor
 * @param  {!silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Body = function(model, view) {
  this.view = view;
  this.model = model;
  // get the iframe
  // retrieve the element which will hold the body of the opened file
  this.iframeElement = /** @type {!HTMLIFrameElement} */ (goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
};


/**
 * element which holds the opened website
 * @type {HTMLIFrameElement}
 */
silex.model.Body.prototype.iframeElement = null;


/**
 * attribute name used to store the type of element
 * @const
 * @type {string}
 */
silex.model.Body.SILEX_TYPE_ATTR_NAME = 'data-silex-type';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.EDITABLE_CLASS_NAME = 'editable-style';


/**
 * class name which can be used to change params of the eitable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.PREVENT_RESIZABLE_CLASS_NAME = 'prevent-resizable';


/**
 * class name which can be used to change params of the eitable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME = 'prevent-draggable';


/**
 * class name which can be used to change params of the eitable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.PREVENT_DROPPABLE_CLASS_NAME = 'prevent-droppable';


/**
 * class name which can be used to force Silex to use height instead of minHeight
 * to set the height of an element
 * this is useful if the element has content with height set to 100%
 * @const
 * @type {string}
 */
silex.model.Body.SILEX_USE_HEIGHT_NOT_MINHEIGHT = 'silex-use-height-not-minheight';


/**
 * class name set on elements in which we are about to drop
 * @const
 * @type {string}
 */
silex.model.Body.DROP_CANDIDATE_CLASS_NAME = 'drop-zone-candidate';


/**
 * class name set on the body while the user is dragging an element
 * @const
 * @type {string}
 */
silex.model.Body.DRAGGING_CLASS_NAME = 'dragging-pending';


/**
 * @return  {Element}   body element
 */
silex.model.Body.prototype.getBodyElement = function() {
  return this.model.file.getContentDocument().body;
};


/**
 * @return  {Array.<Element>}   array of elements which are currently selected
 */
silex.model.Body.prototype.getSelection = function() {
  var elements = goog.dom.getElementsByClass(silex.model.Element.SELECTED_CLASS_NAME, this.getBodyElement());
  if (!elements || elements.length === 0) {
    // default, return the body
    return [this.getBodyElement()];
  }
  // build the result array
  var res = [];
  goog.array.forEach(elements, function(element) {
    res.push(element);
  }, this);
  return res;
};


/**
 * @param  {Array.<Element>} selectedElements  array of elements which are to select
 */
silex.model.Body.prototype.setSelection = function(selectedElements) {
  // reset selection
  var elements = goog.dom.getElementsByClass(silex.model.Element.SELECTED_CLASS_NAME, this.getBodyElement());
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, silex.model.Element.SELECTED_CLASS_NAME);
  }, this);
  // also remove selected class from the body
  goog.dom.classlist.remove(this.getBodyElement(), silex.model.Element.SELECTED_CLASS_NAME);
  // update selection
  goog.array.forEach(selectedElements, function(element) {
    goog.dom.classlist.add(element, silex.model.Element.SELECTED_CLASS_NAME);
  }, this);
  // refresh views
  var pages = this.model.page.getPages();
  var page = this.model.page.getCurrentPage();
  this.view.pageTool.redraw(selectedElements, pages, page);
  this.view.propertyTool.redraw(selectedElements, pages, page);
  this.view.stage.redraw(selectedElements, pages, page);
  this.view.contextMenu.redraw(selectedElements, pages, page);
  this.view.breadCrumbs.redraw(selectedElements, pages, page);
};


/**
 * @return {Object.<boolean>} object of fonts which are used in the text fields (key is the font name)
 */
silex.model.Body.prototype.getNeededFonts = function() {
  var neededFonts = [];
  if (this.getBodyElement()) {
    var innerHTML = this.getBodyElement().innerHTML;
    innerHTML.replace(/<font[^"]*face="?([^"]*)"/gi, function(match, group1) {
      neededFonts[group1] = true;
      return match;
    });
  }
  return neededFonts;
};


/**
 * @param  {Element} element
 */
silex.model.Body.prototype.initUiHandles = function(element) {
  goog.array.forEach([
    'ui-resizable-n',
    'ui-resizable-s',
    'ui-resizable-e',
    'ui-resizable-w',
    'ui-resizable-ne',
    'ui-resizable-nw',
    'ui-resizable-se',
    'ui-resizable-sw'
  ], function(className) {
    var handle = this.model.file.getContentDocument().createElement('div');
    goog.dom.classlist.add(handle, className);
    goog.dom.classlist.add(handle, 'ui-resizable-handle');
    goog.dom.appendChild(element, handle);
  }, this);
};


/**
 * init, activate and remove the "editable" jquery plugin
 * @param {Element} rootElement
 * @param {boolean} isEditable
 */
silex.model.Body.prototype.setEditable = function(rootElement, isEditable) {
  if (!rootElement) {
    // this happens on firefox sometimes at start
    // FIXME: find why this happens instead of this workaround
    return;
  }
  // handle the root element itself
  if (isEditable) {
    if (goog.dom.getElementsByClass('ui-resizable-s', rootElement).length === 0) {
      this.initUiHandles(rootElement);
    }
  }
  else {
      this.removeEditableClasses(rootElement);
  }

  // activate editable plugin on all editable children
  var elements = goog.dom.getElementsByClass(silex.model.Body.EDITABLE_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    if (isEditable && goog.dom.getElementsByClass('ui-resizable-s', element).length === 0) {
      this.initUiHandles(element);
    }
  }, this);
};


/**
 * remove the classes set by Silex and the editable.js plugin
 * @param {Element} rootElement
 */
silex.model.Body.prototype.removeEditableClasses = function(rootElement) {
  if (rootElement !== null) {
    var elements;
    elements = goog.dom.getElementsByClass(silex.model.Element.SELECTED_CLASS_NAME, rootElement);
    goog.array.forEach(elements, function(element) {
      goog.dom.classlist.remove(element, silex.model.Element.SELECTED_CLASS_NAME);
    }, this);

    elements = goog.dom.getElementsByClass(silex.model.Body.DROP_CANDIDATE_CLASS_NAME, rootElement);
    goog.array.forEach(elements, function(element) {
      goog.dom.classlist.remove(element, silex.model.Body.DROP_CANDIDATE_CLASS_NAME);
    }, this);

    elements = rootElement.querySelectorAll('[aria-disabled]');
    goog.array.forEach(elements, function(element) {
      element.removeAttribute('aria-disabled');
    }, this);

    // remove html elements added by the editable.js plugin
    elements = goog.dom.getElementsByClass('ui-resizable-handle', rootElement);
    goog.array.forEach(elements, function(element) {
      goog.dom.removeNode(element);
    }, this);
  }
};
