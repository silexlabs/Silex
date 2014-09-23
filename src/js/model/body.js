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
 *
 *   All model classes are singletons
 */


goog.provide('silex.model.Body');
goog.require('silex.Config');
goog.require('silex.types.Model');



/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Body = function(model, view) {
  this.view = view;
  this.model = model;
  // get the iframe
  // retrieve the element which will hold the body of the opened file
  this.iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
};


/**
 * element which holds the opened website
 */
silex.model.Body.prototype.iframeElement = null;


/**
 * attribute name used to store the type of element
 * @const
 * @type {string}
 */
silex.model.Body.SILEX_TYPE_ATTR_NAME = 'data-silex-type';


/**
 * value of the type attribute
 * @const
 * @type {string}
 */
silex.model.Body.SILEX_TYPE_CONTAINER = 'container';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.EDITABLE_CLASS_NAME = 'editable-style';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.EDITABLE_CREATED_CLASS_NAME = 'editable-plugin-created';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.UI_RESIZABLE_CLASS_NAME = 'ui-resizable';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.UI_DRAGGABLE_CLASS_NAME = 'ui-draggable';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.UI_DROPPABLE_CLASS_NAME = 'ui-droppable';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.UI_DRAGGABLE_DRAGGING_CLASS_NAME = 'ui-draggable-dragging';


/**
 * class name used by the editable jquery plugin
 * @const
 * @type {string}
 */
silex.model.Body.UI_DRAGGABLE_RESIZING_CLASS_NAME = 'ui-resizable-resizing';


/**
 * @return  {Element}   body element
 */
silex.model.Body.prototype.getBodyElement = function() {
  return goog.dom.getFrameContentDocument(this.iframeElement).body;
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
  this.view.pageTool.redraw(selectedElements, this.view.workspace.getWindow().document, pages, page);
  this.view.propertyTool.redraw(selectedElements, this.view.workspace.getWindow().document, pages, page);
  this.view.stage.redraw(selectedElements, this.view.workspace.getWindow().document, pages, page);
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
 * init, activate and remove the "editable" jquery plugin
 * @param {Element} rootElement
 * @param {boolean} isEditable
 * @param {?boolean=} opt_isRootDroppableOnly
 */
silex.model.Body.prototype.setEditable = function(rootElement, isEditable, opt_isRootDroppableOnly) {
  // activate editable plugin
  var elements = goog.dom.getElementsByClass(silex.model.Body.EDITABLE_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    if (isEditable) {
      if (element.getAttribute(silex.model.Body.SILEX_TYPE_ATTR_NAME) === silex.model.Body.SILEX_TYPE_CONTAINER) {
        // containers
        this.view.workspace.getWindow().jQuery(element).editable({
          isContainer: true
        });
      }
      else {
        this.view.workspace.getWindow().jQuery(element).editable();
      }
    }
    else {
      if (goog.dom.classlist.contains(element, silex.model.Body.EDITABLE_CREATED_CLASS_NAME)) {
        this.view.workspace.getWindow().jQuery(element).editable('destroy');
        this.removeEditableClasses(element);
      }
    }
  }, this);

  // handle the root element itself
  if (isEditable) {
    if (rootElement.getAttribute(silex.model.Body.SILEX_TYPE_ATTR_NAME) === silex.model.Body.SILEX_TYPE_CONTAINER) {
      if (opt_isRootDroppableOnly) {
        // allow drops only
        this.view.workspace.getWindow().jQuery(rootElement).editable({
          isContainer: true,
          isResizable: false,
          isDroppable: true,
          isDraggable: false
        });
      }
      else {
        this.view.workspace.getWindow().jQuery(rootElement).editable({
          isContainer: true
        });
      }
    }
    else {
      this.view.workspace.getWindow().jQuery(rootElement).editable();
    }
  }
  else {
    // deactivate editable plugin
    if (goog.dom.classlist.contains(rootElement, silex.model.Body.EDITABLE_CREATED_CLASS_NAME)) {
      this.view.workspace.getWindow().jQuery(rootElement).editable('destroy');
      this.removeEditableClasses(rootElement);
    }
  }
  // add a div on top of the HTML content elements in order to
  // prevent interactions with iframes and html content while editing
  // start by removing all
  var coverElements = rootElement.querySelectorAll('.html-element>.temp-editable-cover');
  goog.array.forEach(coverElements, function(element) {
    goog.dom.removeNode(element);
  }, this);
  // then add one in each HTML element
  var htmlContentElements = rootElement.querySelectorAll('.html-element');
  goog.array.forEach(htmlContentElements, function(element) {
    // create the cover element
    var cover = goog.dom.createElement('div');
    goog.dom.classlist.add(cover, 'temp-editable-cover');
    // insert cover on top of all elements
    goog.dom.insertChildAt(element, cover, 0);
  }, this);
  // handle the root element itself
  if (rootElement.getAttribute(silex.model.Body.SILEX_TYPE_ATTR_NAME) === silex.model.Element.TYPE_HTML) {
    // create the cover element
    var cover = goog.dom.createElement('div');
    goog.dom.classlist.add(cover, 'temp-editable-cover');
    // insert cover on top of all elements
    goog.dom.insertChildAt(rootElement, cover, 0);
  }
};


/**
 * remove the classes set by Silex and the editable.js plugin
 */
silex.model.Body.prototype.removeEditableClasses = function(rootElement) {
  var elements;
  // remove the classes set by Silex
  elements = goog.dom.getElementsByClass(silex.model.Element.SELECTED_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, silex.model.Element.SELECTED_CLASS_NAME);
  }, this);

  // remove classes set by the editable.js plugin
  elements = goog.dom.getElementsByClass(silex.model.Body.EDITABLE_CREATED_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, silex.model.Body.EDITABLE_CREATED_CLASS_NAME);
  }, this);

  elements = goog.dom.getElementsByClass(silex.model.Body.UI_RESIZABLE_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, silex.model.Body.UI_RESIZABLE_CLASS_NAME);
  }, this);

  elements = goog.dom.getElementsByClass(silex.model.Body.UI_DRAGGABLE_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, silex.model.Body.UI_DRAGGABLE_CLASS_NAME);
  }, this);

  elements = goog.dom.getElementsByClass(silex.model.Body.UI_DROPPABLE_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, silex.model.Body.UI_DROPPABLE_CLASS_NAME);
  }, this);

  elements = goog.dom.getElementsByClass(silex.model.Body.UI_DRAGGABLE_DRAGGING_CLASS_NAME, rootElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, silex.model.Body.UI_DRAGGABLE_DRAGGING_CLASS_NAME);
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
  elements = goog.dom.getElementsByClass('temp-editable-cover', rootElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.removeNode(element);
  }, this);
};
