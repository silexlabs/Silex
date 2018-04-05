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
    const bodyElement = this.getBodyElement();
    if(!bodyElement) {
      console.warn('Could not get body element because it is not created yet.');
      return [];
    }
    return [bodyElement];
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
  if(this.getBodyElement() === null) {
    // body is null, this happens while undoing or redoing
    return;
  }
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
  this.view.htmlEditor.setSelection(selectedElements);
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
