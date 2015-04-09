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
 * @fileoverview This is the pane's base class
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
 *
 */


goog.provide('silex.view.pane.PaneBase');



/**
 * base class for all UI panes of the view.pane package
 * @constructor
 *
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.pane.PaneBase = function(element, model, controller) {
  // store references
  /**
   * @type {Element}
   */
  this.element = element;
  /**
   * @type {!silex.types.Model}
   */
  this.model = model;
  /**
   * @type {!silex.types.Controller}
   */
  this.controller = controller;
};


/**
 * base url for relative/absolute urls
 */
silex.view.pane.PaneBase.prototype.baseUrl = null;


/**
 * {bool} flag to prevent redraw while changing a value myself
 *        this is true when the user has used the toolbox to change a value,
 *        while the call to notify the controller is processed
 */
silex.view.pane.PaneBase.prototype.iAmSettingValue = null;


/**
 * {bool} flag to prevent notifying the controller while changing a value myself
 *        this is true during redraw
 *        it is useful because setting a value of an input element
 *        automatically triggers a change event
 */
silex.view.pane.PaneBase.prototype.iAmRedrawing = null;


/**
 * notify the controller that the style changed
 * @param {string} styleName   not css style but camel case
 * @param {?string=} opt_styleValue
 * @param {?Array.<Element>=} opt_elements
 */
silex.view.pane.PaneBase.prototype.styleChanged = function(styleName, opt_styleValue, opt_elements) {
  //  if (this.iAmRedrawing) return;
  this.iAmSettingValue = true;
  // notify the controller
  this.controller.propertyToolController.styleChanged(styleName, opt_styleValue, opt_elements);
  this.iAmSettingValue = false;
};


/**
 * notify the controller that a property has changed
 * @param {string} propertyName   property name, e.g. 'src'
 * @param {?string=} opt_propertyValue
 * @param {?Array.<Element>=} opt_elements
 * @param {?boolean=} opt_applyToContent
 */
silex.view.pane.PaneBase.prototype.propertyChanged = function(propertyName, opt_propertyValue, opt_elements, opt_applyToContent) {
  if (this.iAmRedrawing) {
    return;
  }
  this.iAmSettingValue = true;
  // notify the controller
  this.controller.propertyToolController.propertyChanged(propertyName, opt_propertyValue, opt_elements, opt_applyToContent);
  this.iAmSettingValue = false;
};


/**
 * refresh the displayed data
 * @param   {Array.<Element>} selectedElements the elements currently selected
 * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.pane.PaneBase.prototype.redraw = function(selectedElements, pageNames, currentPageName) {
  if (!selectedElements) {
    throw (new Error('selection array is undefined'));
  }
  /*
  // to be placed in all redraw methods to avoid loops
  if (this.iAmSettingValue) {
    return;
  }
  this.iAmRedrawing = true;
  this.iAmRedrawing = false;
  */
};


/**
 * get the common property of a group of elements
 * @param {Array.<Element>} elements
 * @param {function(Element): ?(string|number|boolean)} getPropertyFunction the callback which returns the value for one element
 * @return ? {string|number|boolean} the value or null if the value is not the same for all elements
 */
silex.view.pane.PaneBase.prototype.getCommonProperty = function(elements, getPropertyFunction) {
  var value = null;
  var hasCommonValue = true;
  var isFirstValue = true;
  goog.array.forEach(elements, function(element) {
    var elementValue = getPropertyFunction(element);
    if (isFirstValue) {
      isFirstValue = false;
      // init value
      value = elementValue;
    }
    else {
      // check if there is a common type
      if (elementValue !== value) {
        hasCommonValue = false;
      }
    }
  }, this);
  if (hasCommonValue === false) {
    value = null;
  }
  return value;
};


/**
 * color palette visibility
 * do not set display to none,
 *     because the setColor then leave the color palette UI unchanged
 * @param {goog.ui.HsvaPalette|goog.ui.HsvPalette} hsvPalette   The HSV palete
 * @param {boolean} isVisible    The desired visibility
 */
silex.view.pane.PaneBase.prototype.setColorPaletteVisibility =
    function(hsvPalette, isVisible) {
  if (isVisible) {
    if (!this.getColorPaletteVisibility(hsvPalette)) {
      goog.style.setStyle(
          hsvPalette.getElement(),
          'visibility',
          '');
      goog.style.setStyle(
          hsvPalette.getElement(),
          'position',
          '');
    }
  }
  else {
    if (this.getColorPaletteVisibility(hsvPalette)) {
      goog.style.setStyle(
          hsvPalette.getElement(),
          'visibility',
          'hidden');
      goog.style.setStyle(
          hsvPalette.getElement(),
          'position',
          'absolute');
    }
  }
};


/**
 * color palette visibility
 * do not set display to none,
 * because the setColor then leave the color palette UI unchanged
 * @param {goog.ui.HsvaPalette|goog.ui.HsvPalette} hsvPalette   The HSV palete
 * @return    {boolean} true if the color palete is visible
 */
silex.view.pane.PaneBase.prototype.getColorPaletteVisibility = function(hsvPalette) {
  return goog.style.getStyle(hsvPalette.getElement(), 'visibility') !== 'hidden';
};
